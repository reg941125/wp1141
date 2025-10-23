import { Request, Response } from 'express';
import db from '../config/database';
import { GoogleMapsService } from '../services/googleMapsService';
import { 
  Restroom, 
  RestroomCreate, 
  RestroomUpdate, 
  RestroomFilters,
  RestroomTag,
  Comment,
  Rating,
  User
} from '../types';

export const getAllRestrooms = async (req: Request, res: Response) => {
  try {
    const filters = req.query as RestroomFilters;
    let query = `
      SELECT r.*, u.username as creator_username
      FROM restrooms r
      LEFT JOIN users u ON r.creator_id = u.id
    `;
    const conditions: string[] = [];
    const params: any[] = [];

    // Apply filters
    if (filters.latitude && filters.longitude && filters.radius) {
      // Add distance calculation (simplified)
      conditions.push(`
        (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
        cos(radians(longitude) - radians(?)) + sin(radians(?)) * 
        sin(radians(latitude)))) <= ?
      `);
      params.push(filters.latitude, filters.longitude, filters.latitude, filters.radius);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY r.created_at DESC';

    const restrooms = db.prepare(query).all(...params) as (Restroom & { creator_username: string })[];

    // Get tags, comments, and ratings for each restroom
    const restroomsWithDetails = restrooms.map(restroom => {
      const tags = db.prepare(
        'SELECT * FROM restroom_tags WHERE restroom_id = ?'
      ).all(restroom.id) as RestroomTag[];

      const comments = db.prepare(`
        SELECT c.*, u.username 
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.restroom_id = ?
        ORDER BY c.created_at DESC
      `).all(restroom.id) as (Comment & { username: string })[];

      const ratings = db.prepare(
        'SELECT * FROM ratings WHERE restroom_id = ?'
      ).all(restroom.id) as Rating[];

      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
        : 0;

      return {
        ...restroom,
        creator: { username: restroom.creator_username },
        tags,
        comments,
        ratings,
        average_rating: Math.round(averageRating * 10) / 10
      };
    });

    res.json({
      success: true,
      data: restroomsWithDetails
    });
  } catch (error) {
    console.error('Get restrooms error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch restrooms'
    });
  }
};

export const getNearbyRestrooms = async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = 2 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const filters = req.query as RestroomFilters;
    
    // Calculate distance and get nearby restrooms
    let query = `
      SELECT r.*, u.username as creator_username,
      (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
      cos(radians(longitude) - radians(?)) + sin(radians(?)) * 
      sin(radians(latitude)))) AS distance
      FROM restrooms r
      LEFT JOIN users u ON r.creator_id = u.id
      WHERE (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
      cos(radians(longitude) - radians(?)) + sin(radians(?)) * 
      sin(radians(latitude)))) <= ?
    `;
    
    const params = [lat, lng, lat, lat, lng, lat, radius];

    // Apply additional filters
    if (filters.min_rating) {
      query += ` AND r.id IN (
        SELECT restroom_id FROM ratings 
        GROUP BY restroom_id 
        HAVING AVG(rating) >= ?
      )`;
      params.push(filters.min_rating);
    }

    query += ' ORDER BY distance ASC';

    const restrooms = db.prepare(query).all(...params) as (Restroom & { 
      creator_username: string;
      distance: number;
    })[];

    res.json({
      success: true,
      data: restrooms
    });
  } catch (error) {
    console.error('Get nearby restrooms error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch nearby restrooms'
    });
  }
};

export const getRestroomById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const restroom = db.prepare(`
      SELECT r.*, u.username as creator_username
      FROM restrooms r
      LEFT JOIN users u ON r.creator_id = u.id
      WHERE r.id = ?
    `).get(id) as (Restroom & { creator_username: string }) | undefined;

    if (!restroom) {
      return res.status(404).json({
        success: false,
        error: 'Restroom not found'
      });
    }

    // Get tags
    const tags = db.prepare(
      'SELECT * FROM restroom_tags WHERE restroom_id = ?'
    ).all(id) as RestroomTag[];

    // Get comments with user info
    const comments = db.prepare(`
      SELECT c.*, u.username 
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.restroom_id = ?
      ORDER BY c.created_at DESC
    `).all(id) as (Comment & { username: string })[];

    // Get ratings
    const ratings = db.prepare(
      'SELECT * FROM ratings WHERE restroom_id = ?'
    ).all(id) as Rating[];

    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
      : 0;

    const restroomWithDetails = {
      ...restroom,
      creator: { username: restroom.creator_username },
      tags,
      comments,
      ratings,
      average_rating: Math.round(averageRating * 10) / 10
    };

    res.json({
      success: true,
      data: restroomWithDetails
    });
  } catch (error) {
    console.error('Get restroom error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch restroom'
    });
  }
};

export const createRestroom = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const restroomData: RestroomCreate = req.body;
    const { name, address, description, picture_url, tags } = restroomData;

    // Validate input
    if (!name || !address) {
      return res.status(400).json({
        success: false,
        error: 'Name and address are required'
      });
    }

    // Geocode address
    const geocodeResult = await GoogleMapsService.geocodeAddress(address);
    
    // Check if location is near NTU
    if (!GoogleMapsService.isNearNTU(geocodeResult.latitude, geocodeResult.longitude)) {
      return res.status(400).json({
        success: false,
        error: 'Location must be within 2km of National Taiwan University'
      });
    }

    // Create restroom
    const stmt = db.prepare(`
      INSERT INTO restrooms (name, address, latitude, longitude, description, creator_id, picture_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name,
      geocodeResult.formatted_address,
      geocodeResult.latitude,
      geocodeResult.longitude,
      description || null,
      userId,
      picture_url || null
    );

    const restroomId = result.lastInsertRowid;

    // Add tags if provided
    if (tags && tags.length > 0) {
      const tagStmt = db.prepare(`
        INSERT INTO restroom_tags (restroom_id, tag_type, tag_value)
        VALUES (?, ?, ?)
      `);

      for (const tag of tags) {
        tagStmt.run(restroomId, tag.tag_type, tag.tag_value);
      }
    }

    // Get created restroom with details
    const createdRestroom = db.prepare(`
      SELECT r.*, u.username as creator_username
      FROM restrooms r
      LEFT JOIN users u ON r.creator_id = u.id
      WHERE r.id = ?
    `).get(restroomId) as (Restroom & { creator_username: string });

    res.status(201).json({
      success: true,
      data: createdRestroom,
      message: 'Restroom created successfully'
    });
  } catch (error) {
    console.error('Create restroom error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create restroom'
    });
  }
};

export const updateRestroom = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { id } = req.params;
    const updateData: RestroomUpdate = req.body;

    // Check if restroom exists and user owns it
    const existingRestroom = db.prepare(
      'SELECT * FROM restrooms WHERE id = ? AND creator_id = ?'
    ).get(id, userId);

    if (!existingRestroom) {
      return res.status(404).json({
        success: false,
        error: 'Restroom not found or you do not have permission to edit it'
      });
    }

    // Update restroom
    const stmt = db.prepare(`
      UPDATE restrooms 
      SET name = COALESCE(?, name),
          address = COALESCE(?, address),
          description = COALESCE(?, description),
          picture_url = COALESCE(?, picture_url)
      WHERE id = ?
    `);

    stmt.run(
      updateData.name || null,
      updateData.address || null,
      updateData.description || null,
      updateData.picture_url || null,
      id
    );

    // Get updated restroom
    const updatedRestroom = db.prepare(`
      SELECT r.*, u.username as creator_username
      FROM restrooms r
      LEFT JOIN users u ON r.creator_id = u.id
      WHERE r.id = ?
    `).get(id);

    res.json({
      success: true,
      data: updatedRestroom,
      message: 'Restroom updated successfully'
    });
  } catch (error) {
    console.error('Update restroom error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update restroom'
    });
  }
};

export const deleteRestroom = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { id } = req.params;

    // Check if restroom exists and user owns it
    const existingRestroom = db.prepare(
      'SELECT * FROM restrooms WHERE id = ? AND creator_id = ?'
    ).get(id, userId);

    if (!existingRestroom) {
      return res.status(404).json({
        success: false,
        error: 'Restroom not found or you do not have permission to delete it'
      });
    }

    // Delete restroom (cascade will handle related records)
    const stmt = db.prepare('DELETE FROM restrooms WHERE id = ?');
    stmt.run(id);

    res.json({
      success: true,
      message: 'Restroom deleted successfully'
    });
  } catch (error) {
    console.error('Delete restroom error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete restroom'
    });
  }
};
