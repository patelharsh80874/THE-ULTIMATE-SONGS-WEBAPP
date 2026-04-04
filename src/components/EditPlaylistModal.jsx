import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Tooltip from "./Tooltip";
import toast from "react-hot-toast";
import axios from "axios";
import API_BASE_URL from "../config/api";

const TOAST_STYLE = { borderRadius: "10px", background: "rgb(115 115 115)", color: "#fff" };
const API = `${API_BASE_URL}/api/playlists`;

const EditPlaylistModal = ({ playlist, onClose, onUpdate }) => {
  const [name, setName] = useState(playlist?.name || "");
  const [description, setDescription] = useState(playlist?.description || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name is required", { style: TOAST_STYLE });
    
    setLoading(true);
    try {
      const { data } = await axios.put(`${API}/${playlist._id}`, {
        name: name.trim(),
        description: description.trim()
      }, { withCredentials: true });
      
      onUpdate(data);
      toast.success("Playlist updated!", { style: TOAST_STYLE });
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update playlist", { style: TOAST_STYLE });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-md bg-slate-900 border border-white/5 rounded-[2rem] p-7 sm:p-6 shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative overflow-hidden group"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Orbs */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full group-hover:bg-purple-500/20 transition-all duration-700"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-green-500/10 blur-[100px] rounded-full group-hover:bg-green-500/20 transition-all duration-700"></div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div>
            <h3 className="text-2xl sm:text-xl font-black text-white tracking-tighter uppercase italic leading-none">
              Edit Archive
            </h3>
            <p className="text-[9px] text-zinc-500 font-black tracking-[0.3em] uppercase mt-1.5 opacity-60">
              Refine your musical vault
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all border border-white/5 active:scale-90"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-3">
              Archive Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-6 py-3.5 bg-slate-800/40 border border-white/5 rounded-2xl text-white placeholder-zinc-700 focus:outline-none focus:border-purple-500/50 font-bold transition-all shadow-inner text-sm"
              placeholder="What's the vibe called?"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-3">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-6 py-3.5 bg-slate-800/40 border border-white/5 rounded-2xl text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-green-500/50 font-medium text-xs transition-all shadow-inner min-h-[100px] resize-none"
              placeholder="Tell a story about this collection..."
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-[10px] hover:bg-white/10 transition-all active:scale-95 uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-3.5 bg-gradient-to-r from-purple-500 to-green-500 text-slate-900 rounded-2xl font-black text-[10px] hover:scale-[1.02] transition-all active:scale-95 shadow-xl shadow-purple-500/10 uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <i className="ri-loader-4-line animate-spin text-lg"></i>
              ) : (
                <>
                  <i className="ri-save-3-line text-base"></i>
                  Sync Changes
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditPlaylistModal;
