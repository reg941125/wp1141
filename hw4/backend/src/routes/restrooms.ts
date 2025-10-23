import { Router } from 'express';
import { 
  getAllRestrooms, 
  getNearbyRestrooms, 
  getRestroomById, 
  createRestroom, 
  updateRestroom, 
  deleteRestroom 
} from '../controllers/restroomController';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', optionalAuth, getAllRestrooms);
router.get('/nearby', optionalAuth, getNearbyRestrooms);
router.get('/:id', optionalAuth, getRestroomById);

// Protected routes
router.post('/', authenticateToken, createRestroom);
router.put('/:id', authenticateToken, updateRestroom);
router.delete('/:id', authenticateToken, deleteRestroom);

export default router;
