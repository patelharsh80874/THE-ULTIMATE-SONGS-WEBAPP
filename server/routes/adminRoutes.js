import express from 'express';
import {
  getAdminStats,
  getAllPlaylists,
  deletePlaylistAdmin,
  updateUserPasswordAdmin,
  toggleBanUser,
  toggleVerifyUser,
  bulkUserAction,
  sendAnnouncement,
  sendEmailToUser,
} from '../controllers/adminController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes are protected by admin check
router.use(protect);
router.use(admin);

router.get('/stats', getAdminStats);
router.get('/playlists', getAllPlaylists);
router.delete('/playlists/:id', deletePlaylistAdmin);
router.put('/users/:id/password', updateUserPasswordAdmin);
router.put('/users/:id/ban', toggleBanUser);
router.put('/users/:id/verify', toggleVerifyUser);
router.post('/users/bulk', bulkUserAction);
router.post('/announce', sendAnnouncement);
router.post('/email-user', sendEmailToUser);

export default router;
