import express from 'express';
import {
  getLikedSongs,
  addLikedSong,
  removeLikedSong,
  getSharedPlaylist,
  importSharedPlaylistKeys,
  reorderLikedSongs,
  getUsers,
  deleteUser,
  updateUserRole,
} from '../controllers/userController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// User Routes
router.route('/likes')
  .get(protect, getLikedSongs)
  .post(protect, addLikedSong);

router.route('/likes/:id')
  .delete(protect, removeLikedSong);

router.post('/likes/import', protect, importSharedPlaylistKeys);
router.put('/likes/reorder', protect, reorderLikedSongs);

// Public Shared Playlist Route
router.get('/shared/:id', getSharedPlaylist);

// Admin Routes
router.route('/')
  .get(protect, admin, getUsers);

router.route('/:id')
  .delete(protect, admin, deleteUser);

router.route('/:id/role')
  .put(protect, admin, updateUserRole);

export default router;
