import User from '../models/User.js';
import Playlist from '../models/Playlist.js';

// @desc    Get system-wide statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalPlaylists = await Playlist.countDocuments({});
    
    // Estimate total unique tracks from all collections (Likes + Playlists)
    const allUsers = await User.find({}).select('likedSongs');
    const allPlaylists = await Playlist.find({}).select('songs');
    
    const songSet = new Set();
    allUsers.forEach(u => u.likedSongs?.forEach(id => songSet.add(id)));
    allPlaylists.forEach(p => p.songs?.forEach(id => songSet.add(id)));

    res.status(200).json({
      totalUsers,
      totalPlaylists,
      totalTracks: songSet.size,
      activeUsers: totalUsers, // Basic placeholder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all playlists in the system
// @route   GET /api/admin/playlists
// @access  Private/Admin
export const getAllPlaylists = async (req, res, next) => {
  try {
    const playlists = await Playlist.find({})
      .populate('owner', 'username email')
      .sort({ createdAt: -1 });
    res.status(200).json(playlists);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete any playlist as admin
// @route   DELETE /api/admin/playlists/:id
// @access  Private/Admin
export const deletePlaylistAdmin = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      res.status(404);
      throw new Error('Playlist not found');
    }

    await playlist.deleteOne();
    res.status(200).json({ message: 'Playlist removed by admin' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user password as admin
// @route   PUT /api/admin/users/:id/password
// @access  Private/Admin
export const updateUserPasswordAdmin = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.password = password;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};
