import mongoose from 'mongoose';
import User from '../models/User.js';

// @desc    Get logged in user's liked songs
// @route   GET /api/users/likes
// @access  Private
export const getLikedSongs = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.status(200).json(user.likedSongs);
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Add a song to liked songs
// @route   POST /api/users/likes
// @access  Private
export const addLikedSong = async (req, res, next) => {
  try {
    const song = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
      // Check if already liked
      const alreadyLiked = user.likedSongs.find((id) => id === song.id);
      if (alreadyLiked) {
        res.status(400);
        throw new Error('Song already liked');
      }

      user.likedSongs.push(song.id);
      await user.save();
      res.status(201).json(user.likedSongs);
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a song from liked songs
// @route   DELETE /api/users/likes/:id
// @access  Private
export const removeLikedSong = async (req, res, next) => {
  try {
    const songId = req.params.id;
    const user = await User.findById(req.user._id);

    if (user) {
      user.likedSongs = user.likedSongs.filter((id) => id !== songId);
      await user.save();
      res.status(200).json(user.likedSongs);
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Remove multiple songs from liked songs
// @route   DELETE /api/users/likes-bulk
// @access  Private
export const removeLikedSongsBulk = async (req, res, next) => {
  try {
    const { songIds } = req.body;
    const user = await User.findById(req.user._id);

    if (user && Array.isArray(songIds)) {
      user.likedSongs = user.likedSongs.filter((id) => !songIds.includes(id));
      await user.save();
      res.status(200).json(user.likedSongs);
    } else {
      res.status(404);
      throw new Error('User not found or invalid payload');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Import an array of song IDs into liked songs
// @route   POST /api/users/likes/import
// @access  Private
export const importSharedPlaylistKeys = async (req, res, next) => {
  try {
    const { songIds } = req.body;
    const user = await User.findById(req.user._id);

    if (user && Array.isArray(songIds)) {
      const combined = [...user.likedSongs, ...songIds];
      user.likedSongs = [...new Set(combined)];
      
      await user.save();
      res.status(200).json(user.likedSongs);
    } else {
      res.status(404);
      throw new Error('User not found or invalid payload');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reorder user's liked songs
// @route   PUT /api/users/likes/reorder
// @access  Private
export const reorderLikedSongs = async (req, res, next) => {
  try {
    const { songIds } = req.body;
    const user = await User.findById(req.user._id);

    if (user && Array.isArray(songIds)) {
      user.likedSongs = songIds;
      await user.save();
      res.status(200).json(user.likedSongs);
    } else {
      res.status(404);
      throw new Error('User not found or invalid payload');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get shared playlist of a specific user
// @route   GET /api/users/shared/:id
// @access  Public
export const getSharedPlaylist = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { username: id };
    }

    const user = await User.findOne(query).select('username likedSongs');
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404);
      throw new Error('Playlist not found');
    }
  } catch (error) {
    next(error);
  }
};

// ==============================
//         ADMIN ROUTES
// ==============================

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      if (user.role === 'admin') {
        res.status(400);
        throw new Error('Cannot delete an admin user');
      }
      await user.deleteOne();
      res.status(200).json({ message: 'User removed' });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.role = req.body.role || user.role;
      const updatedUser = await user.save();

      res.status(200).json({
        _id: updatedUser._id,
        username: updatedUser.username,
        role: updatedUser.role,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};
