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
  addCollaborator,
  removeCollaborator,
  getMyCollaborations,
  getCommunityPlaylists,
} from '../controllers/playlistController.js';
import { 
  analyzeBridge, 
  createBridgePlaylist 
} from '../controllers/bridgeController.js';
import { protect, optionalProtect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// User's own playlists
router.route('/')
  .post(protect, createPlaylist);

// Playlist Bridge (Spotify & YouTube)
router.route('/bridge/analyze')
  .post(protect, analyzeBridge);

router.route('/bridge/create')
  .post(protect, createBridgePlaylist);

router.route('/my')
  .get(protect, getMyPlaylists);

router.route('/collaborations')
  .get(protect, getMyCollaborations);

router.route('/community')
  .get(getCommunityPlaylists);

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

// Collaborators management
router.route('/:id/collaborators')
  .post(protect, addCollaborator);

router.route('/:id/collaborators/:userId')
  .delete(protect, removeCollaborator);

export default router;
