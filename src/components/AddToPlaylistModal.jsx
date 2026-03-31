import React, { useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { usePlaylist } from "../context/PlaylistContext";
import Tooltip from "./Tooltip";
import toast from "react-hot-toast";

const AddToPlaylistModal = ({ song, onClose }) => {
  const { user } = useContext(AuthContext);
  const { playlists, addSongToPlaylist, removeSongFromPlaylist, createPlaylist } = usePlaylist();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  if (!user) {
    toast.error("Please login to add songs to playlists");
    onClose();
    return null;
  }

  const handleAdd = async (playlistId) => {
    await addSongToPlaylist(playlistId, song.id);
  };

  const handleRemove = async (playlistId) => {
    await removeSongFromPlaylist(playlistId, song.id);
  };

  const handleQuickCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const newPl = await createPlaylist(newName);
    if (newPl) {
      await addSongToPlaylist(newPl._id, song.id);
      setNewName("");
      setShowCreate(false);
    }
  };

  const isSongInPlaylist = (pl) => pl.songs?.includes(song.id);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 sm:p-0"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl max-h-[70vh] flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 opacity-50"></div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-black text-white tracking-tight uppercase italic">Manage Playlist</h3>
            <p className="text-xs text-zinc-500 truncate font-bold mt-1 uppercase opacity-60">
              {song?.name}
            </p>
          </div>
          <Tooltip text="Close Manager" position="left">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0 border border-white/5 active:scale-90"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </Tooltip>
        </div>

        {/* Create New */}
        {showCreate ? (
          <motion.form 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleQuickCreate} 
            className="flex gap-2 mb-6"
          >
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 px-5 py-3 bg-slate-800 border border-white/5 rounded-2xl text-white placeholder-zinc-700 focus:outline-none focus:border-green-500/50 font-black text-sm shadow-inner"
              placeholder="VIBE NAME..."
              autoFocus
            />
            <button
              type="submit"
              className="bg-green-500 text-slate-900 px-6 py-3 rounded-2xl font-black text-xs hover:bg-green-400 transition-all active:scale-95 shadow-lg shadow-green-500/20 uppercase tracking-widest"
            >
              Add
            </button>
          </motion.form>
        ) : (
          <Tooltip text="Create a new playlist" position="bottom">
            <button
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center gap-4 p-4 mb-6 rounded-2xl bg-white/5 border border-dashed border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all group active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/30 transition-all">
                <i className="ri-add-line text-green-500 text-xl font-bold"></i>
              </div>
              <div className="text-left">
                  <span className="font-black text-sm block tracking-widest uppercase">Create New Archive</span>
                  <span className="text-[10px] text-zinc-600 font-bold uppercase">Build a new vibe for this song</span>
              </div>
            </button>
          </Tooltip>
        )}

        {/* Playlist List */}
        <div className="overflow-y-auto overflow-x-hidden space-y-2 flex-1 pr-2 custom-scrollbar">
          {playlists.length > 0 ? (
            playlists.map((pl) => {
              const alreadyIn = isSongInPlaylist(pl);
              return (
                <div
                  key={pl._id}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all border ${
                    alreadyIn
                      ? "bg-green-500/5 border-green-500/20 shadow-inner shadow-green-500/5"
                      : "bg-slate-800/30 border-white/5 hover:bg-slate-800/60 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                        alreadyIn
                          ? "bg-green-500/20 text-green-400"
                          : "bg-slate-700/50 text-zinc-500"
                      }`}
                    >
                      <i className={`text-xl ${alreadyIn ? "ri-play-list-2-fill" : "ri-play-list-add-line"}`}></i>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-black truncate tracking-tight uppercase ${alreadyIn ? "text-green-400" : "text-white opacity-80"}`}>{pl.name}</p>
                      <div className="flex items-center gap-2">
                          <span className="text-[9px] text-zinc-600 font-black tracking-widest uppercase italic">{pl.songs?.length || 0} TRACKS</span>
                          {alreadyIn && <span className="text-[8px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter shadow-sm border border-green-500/10">IN ARCHIVE</span>}
                      </div>
                    </div>
                  </div>

                  <Tooltip text={alreadyIn ? "Remove from playlist" : "Add to playlist"} position="left">
                    <button
                        onClick={() => alreadyIn ? handleRemove(pl._id) : handleAdd(pl._id)}
                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-md ${
                            alreadyIn 
                                ? "bg-slate-800 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20" 
                                : "bg-green-500 text-slate-900 hover:bg-green-400"
                        }`}
                    >
                        <i className={`text-xl ${alreadyIn ? "ri-indeterminate-circle-line" : "ri-add-fill font-bold"}`}></i>
                    </button>
                  </Tooltip>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-slate-800/20 rounded-3xl border border-dashed border-white/5">
              <i className="ri-folder-music-line text-5xl text-zinc-800 mb-3 block"></i>
              <p className="text-sm font-black text-zinc-600 uppercase tracking-[0.2em]">Repository Empty</p>
              <p className="text-[10px] text-zinc-700 font-bold mt-1 uppercase">Create your first collection above</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AddToPlaylistModal;
