import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "../context/SocketContext";
import Tooltip from "./Tooltip";
import toast from "react-hot-toast";

const PartyDashboard = ({ onClose }) => {
  const { socket, partyRoom, isHost, participants, createParty, joinParty, leaveParty } = useSocket();
  const [joinId, setJoinId] = useState("");

  const handleCreate = () => {
    const id = createParty();
    if (id) toast.success("Party Started!");
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!joinId.trim()) return;
    const success = joinParty(joinId.trim().toUpperCase());
    if (success) {
      toast.success("Joined Party!");
      setJoinId("");
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(partyRoom);
    toast.success("Room ID Copied!");
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 blur-[80px] rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/20 blur-[80px] rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Listening Party</h2>
              <p className="text-xs text-zinc-500 font-bold tracking-widest uppercase opacity-60">Real-time Synchronized Playback</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          {!partyRoom ? (
            <div className="space-y-6">
              <button
                onClick={handleCreate}
                className="w-full py-5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl text-white font-black uppercase tracking-[0.2em] text-sm shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Host a New Party
              </button>

              <div className="relative py-4 flex items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-4 text-[10px] font-black text-zinc-700 uppercase tracking-widest">OR JOIN ONE</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              <form onSubmit={handleJoin} className="space-y-3">
                <input
                  type="text"
                  placeholder="ENTER ROOM ID..."
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-zinc-700 focus:outline-none focus:border-purple-500/50 font-black text-xs uppercase tracking-widest transition-all"
                />
                <button
                  type="submit"
                  className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-zinc-400 font-black uppercase tracking-widest text-xs hover:bg-white/10 hover:text-white transition-all active:scale-95"
                >
                  Join Party
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="p-6 bg-white/5 border border-white/10 rounded-3xl text-center relative group">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-2">Current Room ID</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl font-black text-white tracking-[0.2em]">{partyRoom}</span>
                  <button onClick={copyId} className="text-zinc-500 hover:text-purple-400 transition-colors">
                    <i className="ri-file-copy-line text-xl"></i>
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Live Sync Enabled</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Participants</span>
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 px-2 py-1 rounded-md">{participants.length} ONLINE</span>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                   {participants.map((p, idx) => (
                      <div key={p.id} className={`flex items-center gap-3 p-3 rounded-2xl border ${socket?.id === p.id ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5'} animate-in fade-in slide-in-from-bottom-1`}>
                        <div className={`w-8 h-8 rounded-full ${idx === 0 ? 'bg-purple-500' : 'bg-slate-700'} flex items-center justify-center text-[10px] font-black text-white uppercase italic`}>
                          {p.username.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-white uppercase tracking-wider">
                            {p.username} {socket?.id === p.id && <span className="text-[10px] text-purple-400 ml-1">(YOU)</span>}
                          </span>
                          <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">
                            {idx === 0 ? 'Party Host' : 'Guest'}
                          </span>
                        </div>
                      </div>
                   ))}
                </div>
              </div>

              <button
                onClick={leaveParty}
                className="w-full py-4 text-red-500 font-black uppercase tracking-widest text-xs hover:bg-red-500/10 rounded-2xl transition-all border border-red-500/10"
              >
                End / Leave Party
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PartyDashboard;
