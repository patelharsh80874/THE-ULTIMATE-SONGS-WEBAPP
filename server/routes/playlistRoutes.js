import express from 'express';
import {
  createPlaylist,
  getMyPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  importPlaylist,
  reorderPlaylistSongs,
  getUserPublicPlaylists,
} from '../controllers/playlistController.js';
import { protect, optionalProtect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// User's own playlists
router.route('/')
  .post(protect, createPlaylist);

router.route('/my')
  .get(protect, getMyPlaylists);

// Browse a user's public playlists + liked songs
router.route('/user/:username')
  .get(getUserPublicPlaylists);

// Single playlist (public access with optional auth for private check)
router.route('/:id')
  .get(optionalProtect, getPlaylistById)
  .put(protect, updatePlaylist)
  .delete(protect, deletePlaylist);

// Songs within a playlist
router.route('/:id/songs')
  .post(protect, addSongToPlaylist);

router.route('/:id/songs/:songId')
  .delete(protect, removeSongFromPlaylist);

router.route('/:id/songs/reorder')
  .put(protect, reorderPlaylistSongs);

// Import (clone) a playlist
router.route('/:id/import')
  .post(protect, importPlaylist);

export default router;
