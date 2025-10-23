import { Request, Response } from 'express';
import db from '../config/database';
import { Friendship, FriendRequest, User } from '../types';

export const getFriends = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const friends = db.prepare(`
      SELECT f.*, u.username, u.email, u.created_at
      FROM friendships f
      LEFT JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = ? AND f.status = 'accepted'
      ORDER BY f.created_at DESC
    `).all(userId) as (Friendship & User)[];

    res.json({
      success: true,
      data: friends
    });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch friends'
    });
  }
};

export const getFriendRequests = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Get incoming friend requests
    const incomingRequests = db.prepare(`
      SELECT f.*, u.username, u.email
      FROM friendships f
      LEFT JOIN users u ON f.user_id = u.id
      WHERE f.friend_id = ? AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `).all(userId) as (Friendship & { username: string; email: string })[];

    // Get outgoing friend requests
    const outgoingRequests = db.prepare(`
      SELECT f.*, u.username, u.email
      FROM friendships f
      LEFT JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = ? AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `).all(userId) as (Friendship & { username: string; email: string })[];

    res.json({
      success: true,
      data: {
        incoming: incomingRequests,
        outgoing: outgoingRequests
      }
    });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch friend requests'
    });
  }
};

export const sendFriendRequest = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { friend_id }: FriendRequest = req.body;

    if (!friend_id) {
      return res.status(400).json({
        success: false,
        error: 'Friend ID is required'
      });
    }

    if (friend_id === userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot send friend request to yourself'
      });
    }

    // Check if friend exists
    const friend = db.prepare('SELECT id FROM users WHERE id = ?').get(friend_id);
    if (!friend) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if friendship already exists
    const existingFriendship = db.prepare(`
      SELECT * FROM friendships 
      WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `).get(userId, friend_id, friend_id, userId);

    if (existingFriendship) {
      return res.status(409).json({
        success: false,
        error: 'Friendship already exists or request already sent'
      });
    }

    // Create friend request
    const stmt = db.prepare(`
      INSERT INTO friendships (user_id, friend_id, status)
      VALUES (?, ?, 'pending')
    `);

    const result = stmt.run(userId, friend_id);

    res.status(201).json({
      success: true,
      message: 'Friend request sent successfully'
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send friend request'
    });
  }
};

export const acceptFriendRequest = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { id } = req.params;

    // Check if friend request exists and is directed to current user
    const friendRequest = db.prepare(`
      SELECT * FROM friendships 
      WHERE id = ? AND friend_id = ? AND status = 'pending'
    `).get(id, userId) as { id: number; user_id: number; friend_id: number; status: string } | undefined;

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        error: 'Friend request not found'
      });
    }

    // Update friendship status to accepted
    const stmt = db.prepare(`
      UPDATE friendships 
      SET status = 'accepted'
      WHERE id = ?
    `);

    stmt.run(id);

    // Create reciprocal friendship
    const reciprocalStmt = db.prepare(`
      INSERT INTO friendships (user_id, friend_id, status)
      VALUES (?, ?, 'accepted')
    `);

    reciprocalStmt.run(userId, friendRequest.user_id);

    res.json({
      success: true,
      message: 'Friend request accepted successfully'
    });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept friend request'
    });
  }
};

export const removeFriend = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { id } = req.params;

    // Remove friendship (both directions)
    const stmt = db.prepare(`
      DELETE FROM friendships 
      WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `);

    const result = stmt.run(userId, id, id, userId);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Friendship not found'
      });
    }

    res.json({
      success: true,
      message: 'Friend removed successfully'
    });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove friend'
    });
  }
};

export const getFriendActivity = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Get friend IDs
    const friendRows = db.prepare(`
      SELECT friend_id FROM friendships 
      WHERE user_id = ? AND status = 'accepted'
    `).all(userId) as { friend_id: number }[];
    const friendIds = friendRows.map(row => row.friend_id);

    if (friendIds.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get recent restrooms added by friends
    const recentRestrooms = db.prepare(`
      SELECT r.*, u.username as creator_username
      FROM restrooms r
      LEFT JOIN users u ON r.creator_id = u.id
      WHERE r.creator_id IN (${friendIds.map(() => '?').join(',')})
      ORDER BY r.created_at DESC
      LIMIT 20
    `).all(...friendIds);

    // Get recent comments by friends
    const recentComments = db.prepare(`
      SELECT c.*, u.username, r.name as restroom_name
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN restrooms r ON c.restroom_id = r.id
      WHERE c.user_id IN (${friendIds.map(() => '?').join(',')})
      ORDER BY c.created_at DESC
      LIMIT 20
    `).all(...friendIds);

    // Combine and sort activities
    const activities = [
      ...recentRestrooms.map((restroom: any) => ({
        type: 'restroom_added',
        data: restroom,
        created_at: restroom.created_at
      })),
      ...recentComments.map((comment: any) => ({
        type: 'comment_added',
        data: comment,
        created_at: comment.created_at
      }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({
      success: true,
      data: activities.slice(0, 30) // Return last 30 activities
    });
  } catch (error) {
    console.error('Get friend activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch friend activity'
    });
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || q.toString().trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }

    const searchTerm = `%${q}%`;
    const users = db.prepare(`
      SELECT id, username, email, created_at
      FROM users
      WHERE username LIKE ? OR email LIKE ?
      ORDER BY username ASC
      LIMIT 20
    `).all(searchTerm, searchTerm) as User[];

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search users'
    });
  }
};
