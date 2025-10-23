import { Request, Response } from 'express';
import db from '../config/database';
import { Comment, CommentCreate, Rating, RatingCreate } from '../types';

export const getCommentsByRestroom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const comments = db.prepare(`
      SELECT c.*, u.username 
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.restroom_id = ?
      ORDER BY c.created_at DESC
    `).all(id) as (Comment & { username: string })[];

    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comments'
    });
  }
};

export const addComment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { id } = req.params;
    const { content }: CommentCreate = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Comment content is required'
      });
    }

    // Check if restroom exists
    const restroom = db.prepare('SELECT id FROM restrooms WHERE id = ?').get(id);
    if (!restroom) {
      return res.status(404).json({
        success: false,
        error: 'Restroom not found'
      });
    }

    // Create comment
    const stmt = db.prepare(`
      INSERT INTO comments (restroom_id, user_id, content)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(id, userId, content.trim());

    // Get created comment with user info
    const newComment = db.prepare(`
      SELECT c.*, u.username 
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid) as (Comment & { username: string });

    res.status(201).json({
      success: true,
      data: newComment,
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment'
    });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { id } = req.params;

    // Check if comment exists and user owns it
    const existingComment = db.prepare(
      'SELECT * FROM comments WHERE id = ? AND user_id = ?'
    ).get(id, userId);

    if (!existingComment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found or you do not have permission to delete it'
      });
    }

    // Delete comment
    const stmt = db.prepare('DELETE FROM comments WHERE id = ?');
    stmt.run(id);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment'
    });
  }
};

export const addRating = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { id } = req.params;
    const { rating }: RatingCreate = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }

    // Check if restroom exists
    const restroom = db.prepare('SELECT id FROM restrooms WHERE id = ?').get(id);
    if (!restroom) {
      return res.status(404).json({
        success: false,
        error: 'Restroom not found'
      });
    }

    // Insert or update rating (upsert)
    const stmt = db.prepare(`
      INSERT INTO ratings (restroom_id, user_id, rating)
      VALUES (?, ?, ?)
      ON CONFLICT(restroom_id, user_id) 
      DO UPDATE SET rating = ?, created_at = CURRENT_TIMESTAMP
    `);

    const result = stmt.run(id, userId, rating, rating);

    res.json({
      success: true,
      message: 'Rating added successfully'
    });
  } catch (error) {
    console.error('Add rating error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add rating'
    });
  }
};
