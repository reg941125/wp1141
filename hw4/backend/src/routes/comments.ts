import { Router } from 'express';
import { 
  getCommentsByRestroom, 
  addComment, 
  deleteComment,
  addRating 
} from '../controllers/commentController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/restroom/:id', getCommentsByRestroom);

// Protected routes
router.post('/restroom/:id', authenticateToken, addComment);
router.delete('/:id', authenticateToken, deleteComment);
router.post('/restroom/:id/rate', authenticateToken, addRating);

export default router;
