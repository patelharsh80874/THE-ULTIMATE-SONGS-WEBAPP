import mongoose from 'mongoose';

const listeningPartySchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  hostId: {
    type: String, // Socket ID of the host
    required: true
  },
  hostUsername: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Automatically delete after 24 hours just in case
  }
});

const ListeningParty = mongoose.model('ListeningParty', listeningPartySchema);

export default ListeningParty;
