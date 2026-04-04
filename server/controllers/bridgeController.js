import { analyzePlaylist } from '../services/bridgeService.js';
import Playlist from '../models/Playlist.js';

/**
 * Controller for Universal Playlist Bridge (Spotify & YouTube)
 */

export const analyzeBridge = async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
        res.status(400);
        throw new Error('Please provide a valid Spotify or YouTube playlist URL');
    }

    const result = await analyzePlaylist(url);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const createBridgePlaylist = async (req, res, next) => {
  try {
    const { name, description, songIds, isPublic } = req.body;

    if (!name || !Array.isArray(songIds)) {
      res.status(400);
      throw new Error('Playlist name and song IDs are required');
    }

    const playlist = await Playlist.create({
      name: name.trim(),
      description: description?.trim() || 'Imported via Bridge',
      owner: req.user._id,
      isPublic: (isPublic === undefined || isPublic === null) ? true : isPublic,
      songs: songIds
    });

    res.status(201).json(playlist);
  } catch (error) {
    next(error);
  }
};
