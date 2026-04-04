import { Server } from 'socket.io';
import ListeningParty from './models/ListeningParty.js';

const partyRooms = new Map(); // roomId -> { hostId, members: Map(socketId -> username) }

export const initSocket = (server, allowedOrigins) => {
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join-party', async ({ roomId, username, isCreation }) => {
      let roomExists = partyRooms.has(roomId);
      
      if (!roomExists) {
        const dbRoom = await ListeningParty.findOne({ roomId });
        if (dbRoom) {
          roomExists = true;
          partyRooms.set(roomId, {
            hostId: dbRoom.hostId,
            members: new Map()
          });
        }
      }

      if (!roomExists && !isCreation) {
        return socket.emit('party-error', { message: 'Invalid or ended party code.' });
      }

      socket.join(roomId);
      
      if (!partyRooms.has(roomId)) {
        partyRooms.set(roomId, {
          hostId: socket.id,
          members: new Map()
        });
        
        try {
          await ListeningParty.findOneAndUpdate(
            { roomId },
            { roomId, hostId: socket.id, hostUsername: username },
            { upsert: true, new: true }
          );
        } catch (err) {
          console.error("DB Error creating party:", err);
        }
      }

      partyRooms.get(roomId).members.set(socket.id, username || 'Anonymous');
      
      const participants = Array.from(partyRooms.get(roomId).members.entries()).map(([id, name]) => ({
        id,
        username: name
      }));
      io.to(roomId).emit('party-update', { participants });
    });

    socket.on('leave-party', async (roomId) => {
      socket.leave(roomId);
      if (partyRooms.has(roomId)) {
        const roomData = partyRooms.get(roomId);
        if (roomData.hostId === socket.id) {
          socket.to(roomId).emit('party-ended');
          partyRooms.delete(roomId);
          await ListeningParty.findOneAndDelete({ roomId });
        } else {
          roomData.members.delete(socket.id);
          const participants = Array.from(roomData.members.entries()).map(([id, name]) => ({
              id,
              username: name
          }));
          io.to(roomId).emit('party-update', { participants });
        }
      }
    });

    socket.on('sync-playback', (data) => {
      socket.to(data.roomId).emit('playback-state', data);
    });

    socket.on('request-sync', (roomId) => {
      socket.to(roomId).emit('need-sync', socket.id);
    });

    socket.on('disconnecting', async () => {
      for (const room of socket.rooms) {
        if (partyRooms.has(room)) {
          const roomData = partyRooms.get(room);
          if (roomData.hostId === socket.id) {
            socket.to(room).emit('party-ended');
            partyRooms.delete(room);
            await ListeningParty.findOneAndDelete({ roomId: room });
          } else {
            roomData.members.delete(socket.id);
            const participants = Array.from(roomData.members.entries()).map(([id, name]) => ({
              id,
              username: name
            }));
            io.to(room).emit('party-update', { participants });
          }
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};
