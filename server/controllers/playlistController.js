import Playlist from '../models/Playlist.js';
import User from '../models/User.js';

// @desc    Create a new playlist
// @route   POST /api/playlists
// @access  Private
export const createPlaylist = async (req, res, next) => {
  try {
    console.log('[DEBUG] Create Playlist Hit');
    console.log('[DEBUG] User:', req.user?._id);
    console.log('[DEBUG] Body:', JSON.stringify(req.body));

    const { name, description, isPublic, songs } = req.body;

    if (!name || name.trim() === '') {
      res.status(400);
      throw new Error('Playlist name is required');
    }

    const playlist = await Playlist.create({
      name: name.trim(),
      description: description?.trim() || '',
      owner: req.user._id,
      isPublic: isPublic === undefined ? true : isPublic,
      songs: Array.isArray(songs) ? songs : []
    });

    return res.status(201).json(playlist);
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
      .select('name description songs isPublic collaborators owner createdAt updatedAt');

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
      .populate('owner', 'username')
      .populate('collaborators', 'username');

    if (!playlist) {
      res.status(404);
      throw new Error('Playlist not found');
    }

    // Check access: public playlists are visible to all,
    // private playlists only to the owner or collaborators
    const isOwner = req.user && String(playlist.owner?._id || playlist.owner) === String(req.user._id);
    const isCollaborator = req.user && playlist.collaborators?.some(c => String(c._id || c) === String(req.user._id));
    
    if (!playlist.isPublic && !isOwner && !isCollaborator) {
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
      allSongIds: playlist.songs, // All IDs for global search
      totalSongs,
      page,
      totalPages: Math.ceil(totalSongs / limit),
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
      collaborators: playlist.collaborators,
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

    const isOwner = playlist.owner.toString() === req.user._id.toString();
    const isCollaborator = playlist.collaborators?.some(c => (c._id || c).toString() === req.user._id.toString());

    if (!isOwner && !isCollaborator) {
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

    const isOwner = playlist.owner.toString() === req.user._id.toString();
    const isCollaborator = playlist.collaborators?.some(c => (c._id || c).toString() === req.user._id.toString());

    if (!isOwner && !isCollaborator) {
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

    const isOwner = playlist.owner.toString() === req.user._id.toString();
    const isCollaborator = playlist.collaborators?.some(c => (c._id || c).toString() === req.user._id.toString());

    if (!isOwner && !isCollaborator) {
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

// @desc    Remove multiple songs from a playlist (Bulk)
// @route   DELETE /api/playlists/:id/songs-bulk
// @access  Private (Owner or Collaborator)
export const removeSongsBulk = async (req, res, next) => {
  try {
    const { songIds } = req.body;
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      res.status(404);
      throw new Error('Playlist not found');
    }

    const isOwner = playlist.owner.toString() === req.user._id.toString();
    const isCollaborator = playlist.collaborators?.some(c => (c._id || c).toString() === req.user._id.toString());

    if (!isOwner && !isCollaborator) {
      res.status(403);
      throw new Error('Not authorized to modify this playlist');
    }

    if (!Array.isArray(songIds)) {
      res.status(400);
      throw new Error('Please provide an array of song IDs');
    }

    playlist.songs = playlist.songs.filter(id => !songIds.includes(id));
    await playlist.save();

    res.status(200).json(playlist);
  } catch (error) {
    next(error);
  }
};

// @desc    Add multiple songs to a playlist (Bulk)
// @route   POST /api/playlists/:id/songs-bulk
// @access  Private (Owner or Collaborator)
export const addSongsBulk = async (req, res, next) => {
  try {
    const { songIds } = req.body;
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      res.status(404);
      throw new Error('Playlist not found');
    }

    const isOwner = playlist.owner.toString() === req.user._id.toString();
    const isCollaborator = playlist.collaborators?.some(c => (c._id || c).toString() === req.user._id.toString());

    if (!isOwner && !isCollaborator) {
      res.status(403);
      throw new Error('Not authorized to modify this playlist');
    }

    if (!Array.isArray(songIds)) {
      res.status(400);
      throw new Error('Please provide an array of song IDs');
    }

    // Filter out songs already in the playlist to avoid duplicates
    const newSongs = songIds.filter(id => !playlist.songs.includes(id));
    playlist.songs.push(...newSongs);
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

    const isOwner = playlist.owner.toString() === req.user._id.toString();
    const isCollaborator = playlist.collaborators?.some(c => (c._id || c).toString() === req.user._id.toString());

    if (!isOwner && !isCollaborator) {
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

// @desc    Add a collaborator to a playlist
// @route   POST /api/playlists/:id/collaborators
// @access  Private (Owner or existing Collaborator)
export const addCollaborator = async (req, res, next) => {
  try {
    const { username } = req.body;
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      res.status(404);
      throw new Error('Playlist not found');
    }

    const isOwner = playlist.owner.toString() === req.user._id.toString();
    const isCollaborator = playlist.collaborators?.some(c => c.toString() === req.user._id.toString());

    if (!isOwner && !isCollaborator) {
      res.status(403);
      throw new Error('Not authorized to manage collaborators');
    }

    const userToAdd = await User.findOne({ username });
    if (!userToAdd) {
      res.status(404);
      throw new Error('User to add not found');
    }

    if (playlist.owner.toString() === userToAdd._id.toString()) {
      res.status(400);
      throw new Error('User is already the owner');
    }

    if (playlist.collaborators.includes(userToAdd._id)) {
      res.status(400);
      throw new Error('User is already a collaborator');
    }

    playlist.collaborators.push(userToAdd._id);
    await playlist.save();
    const updatedPlaylist = await Playlist.findById(playlist._id).populate('collaborators', 'username');

    res.status(200).json({ 
      message: 'Collaborator added successfully', 
      collaborators: updatedPlaylist.collaborators 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a collaborator from a playlist
// @route   DELETE /api/playlists/:id/collaborators/:userId
// @access  Private (Owner or the collaborator themselves)
export const removeCollaborator = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    const userIdToRemove = req.params.userId;

    if (!playlist) {
      res.status(404);
      throw new Error('Playlist not found');
    }

    const isOwner = playlist.owner.toString() === req.user._id.toString();
    const isSelf = userIdToRemove === req.user._id.toString();

    if (!isOwner && !isSelf) {
      res.status(403);
      throw new Error('Not authorized to remove this collaborator');
    }

    playlist.collaborators = playlist.collaborators.filter(c => c.toString() !== userIdToRemove);
    await playlist.save();
    const updatedPlaylist = await Playlist.findById(playlist._id).populate('collaborators', 'username');

    res.status(200).json({ 
      message: 'Collaborator removed successfully', 
      collaborators: updatedPlaylist.collaborators 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get playlists where user is a collaborator
// @route   GET /api/playlists/collaborations
// @access  Private
export const getMyCollaborations = async (req, res, next) => {
  try {
    const playlists = await Playlist.find({ collaborators: req.user._id })
      .populate('owner', 'username')
      .sort({ updatedAt: -1 });

    res.status(200).json(playlists);
  } catch (error) {
    next(error);
  }
};
// @desc    Get all public playlists (Community) with pagination and search
// @route   GET /api/playlists/community
// @access  Public
export const getCommunityPlaylists = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'updatedAt'; // 'updatedAt', 'name', 'songCount'

    let query = { isPublic: true };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    let sortOption = {};
    if (sortBy === 'name') {
      sortOption = { name: 1 };
    } else if (sortBy === 'songCount') {
      // Note: Sorting by virtuals is not directly possible in MongoDB 
      // We might need to sort in-memory if we want songCount, or stick to updatedAt
      sortOption = { updatedAt: -1 };
    } else {
      sortOption = { updatedAt: -1 };
    }

    const playlists = await Playlist.find(query)
      .populate('owner', 'username profileImage')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .select('name description songs owner createdAt updatedAt isPublic');

    const total = await Playlist.countDocuments(query);

    res.status(200).json({
      playlists,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    });
  } catch (error) {
    next(error);
  }
};
