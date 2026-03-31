import mongoose from 'mongoose';

const playlistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    songs: {
      type: [String], // JioSaavn song IDs
      default: [],
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Virtual for song count
playlistSchema.virtual('songCount').get(function () {
  return this.songs.length;
});

// Ensure virtuals are included in JSON
playlistSchema.set('toJSON', { virtuals: true });
playlistSchema.set('toObject', { virtuals: true });

const Playlist = mongoose.model('Playlist', playlistSchema);

export default Playlist;
