import express from 'express';
import {
  getAdminStats,
  getAllPlaylists,
  deletePlaylistAdmin,
  updateUserPasswordAdmin,
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

export default router;
