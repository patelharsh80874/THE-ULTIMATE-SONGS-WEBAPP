import Playlist from '../models/Playlist.js';
import User from '../models/User.js';

// @desc    Create a new playlist
// @route   POST /api/playlists
// @access  Private
export const createPlaylist = async (req, res, next) => {
  try {
    const { name, description, isPublic } = req.body;

    if (!name || name.trim() === '') {
      res.status(400);
      throw new Error('Playlist name is required');
    }

    const playlist = await Playlist.create({
      name: name.trim(),
      description: description?.trim() || '',
      owner: req.user._id,
      isPublic: isPublic === undefined ? true : isPublic,
    });

    res.status(201).json(playlist);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all playlists of logged-in user
// @route   GET /api/playlists/my
// @access  Private
export const getMyPlaylists = async (req, res, next) => {
  try {
    const playlists = await Playlist.find({ owner: req.user._id })
      .sort({ updatedAt: -1 })
      .select('name description songs isPublic createdAt updatedAt');

    // Return playlists with song count (virtual field handles this)
    res.status(200).json(playlists);
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single playlist by ID (public or owner)
// @route   GET /api/playlists/:id
// @access  Public (if public) / Private (if owner)
export const getPlaylistById = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate('owner', 'username');

    if (!playlist) {
      res.status(404);
      throw new Error('Playlist not found');
    }

    // Check access: public playlists are visible to all,
    // private playlists only to the owner
    const isOwner = req.user && String(playlist.owner._id || playlist.owner) === String(req.user._id);
    
    if (!playlist.isPublic && !isOwner) {
      res.status(403);
      throw new Error('This playlist is private');
    }

    // Pagination for songs
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedSongs = playlist.songs.slice(startIndex, endIndex);
    const totalSongs = playlist.songs.length;

    res.status(200).json({
      _id: playlist._id,
      name: playlist.name,
      description: playlist.description,
      owner: playlist.owner,
      isPublic: playlist.isPublic,
      songs: paginatedSongs,
      totalSongs,
      page,
      totalPages: Math.ceil(totalSongs / limit),
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update playlist details (name, description, isPublic)
// @route   PUT /api/playlists/:id
// @access  Private (owner only)
export const updatePlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      res.status(404);
      throw new Error('Playlist not found');
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to edit this playlist');
    }

    const { name, description, isPublic } = req.body;
    if (name) playlist.name = name.trim();
    if (description !== undefined) playlist.description = description.trim();
    if (isPublic !== undefined) playlist.isPublic = isPublic;

    const updated = await playlist.save();
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a playlist
// @route   DELETE /api/playlists/:id
// @access  Private (owner only)
export const deletePlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      res.status(404);
      throw new Error('Playlist not found');
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this playlist');
    }

    await playlist.deleteOne();
    res.status(200).json({ message: 'Playlist deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a song to a playlist
// @route   POST /api/playlists/:id/songs
// @access  Private (owner only)
export const addSongToPlaylist = async (req, res, next) => {
  try {
    const { songId } = req.body;
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      res.status(404);
      throw new Error('Playlist not found');
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to modify this playlist');
    }

    if (playlist.songs.includes(songId)) {
      res.status(400);
      throw new Error('Song already in playlist');
    }

    playlist.songs.push(songId);
    await playlist.save();

    res.status(200).json(playlist);
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a song from a playlist
// @route   DELETE /api/playlists/:id/songs/:songId
// @access  Private (owner only)
export const removeSongFromPlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      res.status(404);
      throw new Error('Playlist not found');
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to modify this playlist');
    }

    playlist.songs = playlist.songs.filter(id => id !== req.params.songId);
    await playlist.save();

    res.status(200).json(playlist);
  } catch (error) {
    next(error);
  }
};

// @desc    Reorder songs in a playlist
// @route   PUT /api/playlists/:id/songs/reorder
// @access  Private (owner only)
export const reorderPlaylistSongs = async (req, res, next) => {
  try {
    const { songIds } = req.body;
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      res.status(404);
      throw new Error('Playlist not found');
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to modify this playlist');
    }

    if (!Array.isArray(songIds)) {
      res.status(400);
      throw new Error('Invalid song list format');
    }

    playlist.songs = songIds;
    await playlist.save();

    res.status(200).json(playlist);
  } catch (error) {
    next(error);
  }
};

// @desc    Clone (import) a public playlist to own account
// @route   POST /api/playlists/:id/import
// @access  Private
export const importPlaylist = async (req, res, next) => {
  try {
    const sourcePlaylist = await Playlist.findById(req.params.id)
      .populate('owner', 'username');

    if (!sourcePlaylist) {
      res.status(404);
      throw new Error('Playlist not found');
    }

    if (!sourcePlaylist.isPublic) {
      res.status(403);
      throw new Error('This playlist is private and cannot be imported');
    }

    // Prevent importing own playlist
    if (sourcePlaylist.owner._id.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error('You cannot import your own playlist');
    }

    // Create a new playlist with the same songs
    const newPlaylist = await Playlist.create({
      name: `${sourcePlaylist.name} (from ${sourcePlaylist.owner.username})`,
      description: `Imported from ${sourcePlaylist.owner.username}'s playlist`,
      owner: req.user._id,
      songs: [...sourcePlaylist.songs],
    });

    res.status(201).json(newPlaylist);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all public playlists + liked songs info for a user by username
// @route   GET /api/playlists/user/:username
// @access  Public
export const getUserPublicPlaylists = async (req, res, next) => {
  try {
    const { username } = req.params;

    // Find the user
    const user = await User.findOne({ username }).select('username likedSongs');
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Get their public playlists
    const playlists = await Playlist.find({ owner: user._id, isPublic: true })
      .sort({ updatedAt: -1 })
      .select('name description songs isPublic createdAt updatedAt');

    res.status(200).json({
      username: user.username,
      userId: user._id,
      likedSongsCount: user.likedSongs.length,
      likedSongIds: user.likedSongs,
      playlists,
    });
  } catch (error) {
    next(error);
  }
};
