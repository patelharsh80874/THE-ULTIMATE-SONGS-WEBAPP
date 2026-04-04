import User from '../models/User.js';

// @desc    Add a song to listening history
// @route   POST /api/users/history
// @access  Private
export const addToHistory = async (req, res, next) => {
  try {
    const { songId } = req.body;
    if (!songId) {
      res.status(400);
      throw new Error('Song ID is required');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // UNIQUE HISTORY LOGIC:
    // If the song is already in the history, remove it and move it to the front
    let history = user.listeningHistory || [];
    history = history.filter((id) => id !== songId);
    
    // Add to the front
    history.unshift(songId);

    // Keep only unique 50 songs
    user.listeningHistory = history.slice(0, 50);

    await user.save();
    res.status(200).json(user.listeningHistory);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's listening history
// @route   GET /api/users/history
// @access  Private
export const getHistory = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.status(200).json(user.listeningHistory || []);
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};
