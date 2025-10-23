import { Router } from 'express';
import { 
  getFriends, 
  getFriendRequests, 
  sendFriendRequest, 
  acceptFriendRequest, 
  removeFriend,
  getFriendActivity,
  searchUsers 
} from '../controllers/friendController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getFriends);
router.get('/requests', getFriendRequests);
router.get('/activity', getFriendActivity);
router.get('/search', searchUsers);
router.post('/request', sendFriendRequest);
router.put('/accept/:id', acceptFriendRequest);
router.delete('/:id', removeFriend);

export default router;
