import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";
import API_BASE_URL from "../config/api";
import toast from "react-hot-toast";

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [partyRoom, setPartyRoom] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [participants, setParticipants] = useState([]);
  
  // Environment Detection for Vercel (No WebSocket Support on Serverless)
  const isVercelHost = typeof window !== 'undefined' && 
    (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('now.sh'));
  
  const isSocketSupported = process.env.NODE_ENV !== 'production' || !isVercelHost;

  // Cleanup on unmount or user logout
  useEffect(() => {
    return () => {
      if (socket) {
        console.log("Socket disconnecting on cleanup...");
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [socket]);

  // Internal connection helper
  const connectSocket = useCallback(() => {
    if (socket?.connected) return socket;

    if (!isSocketSupported) {
      console.warn("Socket connections are disabled on Vercel Production Environment.");
      return null;
    }

    console.log("Initializing on-demand socket connection...");
    const newSocket = io(API_BASE_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 3, // Prevent infinite retry loops on Vercel
      reconnectionDelay: 5000,
    });

    // Attach core listeners
    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });

    newSocket.on("party-update", ({ participants: updatedParticipants }) => {
      setParticipants(updatedParticipants);
    });

    newSocket.on("party-ended", () => {
      setPartyRoom(null);
      setIsHost(false);
      setParticipants([]);
      toast.success("The host has ended the party.");
      
      // On-demand: Disconnect when party ends
      newSocket.disconnect();
      setSocket(null);
    });

    newSocket.on("party-error", ({ message }) => {
      setPartyRoom(null);
      setIsHost(false);
      toast.error(message);
      
      // On-demand: Disconnect on error
      newSocket.disconnect();
      setSocket(null);
    });

    setSocket(newSocket);
    return newSocket;
  }, [socket, API_BASE_URL]);

  const createParty = useCallback(() => {
    if (!user) return null;
    
    // Ensure socket is connected
    const activeSocket = connectSocket();
    if (!activeSocket) {
      toast.error("Real-time sync is not supported on this platform.");
      return null;
    }
    
    const roomId = `PARTY-${user.username.toUpperCase() || 'HOST'}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    activeSocket.emit("join-party", { roomId, username: user.username, isCreation: true });
    setPartyRoom(roomId);
    setIsHost(true);
    return roomId;
  }, [user, connectSocket]);

  const joinParty = useCallback((roomId) => {
    if (!user) return false;

    // Ensure socket is connected
    const activeSocket = connectSocket();
    if (!activeSocket) {
      toast.error("Real-time sync is not supported on this platform.");
      return false;
    }

    activeSocket.emit("join-party", { roomId, username: user.username, isCreation: false });
    setPartyRoom(roomId);
    setIsHost(false);
    return true;
  }, [user, connectSocket]);

  const leaveParty = useCallback(() => {
    if (!socket || !partyRoom) return;
    socket.emit("leave-party", partyRoom);
    
    // On-demand: Disconnect when leaving
    socket.disconnect();
    setSocket(null);

    setPartyRoom(null);
    setIsHost(false);
    setParticipants([]);
  }, [socket, partyRoom]);

  const emitPlayback = useCallback((data) => {
    if (!socket || !partyRoom || !isHost) return;
    socket.emit("sync-playback", { ...data, roomId: partyRoom });
  }, [socket, partyRoom, isHost]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        partyRoom,
        isHost,
        participants,
        createParty,
        joinParty,
        leaveParty,
        emitPlayback,
        isSocketSupported
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
