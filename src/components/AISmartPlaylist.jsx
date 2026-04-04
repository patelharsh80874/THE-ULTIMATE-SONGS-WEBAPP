import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateAIPlaylist, API_BASE_URL } from '../services/aiService';
import toast from 'react-hot-toast';
import { usePlayer } from '../context/PlayerContext';

const AISmartPlaylist = ({ onClose, onSaveSuccess }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { playSong, addToQueue } = usePlayer();

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return toast.error('Please enter a mood or theme!');

    setLoading(true);
    setPlaylist([]);
    try {
      const data = await generateAIPlaylist(prompt);
      if (data.success && data.playlist.length > 0) {
        setPlaylist(data.playlist);
        setTitle(data.title || '');
        setDescription(data.description || '');
        setHasGenerated(true);
        toast.success(`Generated ${data.playlist.length} tracks!`);
      } else {
        toast.error('AI couldn\'t find matching tracks. Try a different prompt.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to generate playlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTrack = (id) => {
    setPlaylist(prev => prev.filter(track => track.id !== id));
    toast('Track removed from this list', { icon: '🗑️', duration: 1000 });
  };

  const playAll = () => {
    if (playlist.length === 0) return;
    playSong(playlist[0], 0, playlist);
    toast.success('Playing your AI playlist!');
    onClose();
  };

  const handleSavePlaylist = async () => {
    if (playlist.length === 0) return;
    setSaving(true);
    try {
      console.log('[DEBUG] Saving playlist to:', `${API_BASE_URL}/playlists`);
      const response = await fetch(`${API_BASE_URL}/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: title.trim() || `AI: ${prompt.substring(0, 20)}`,
          description: description.trim() || `AI Generated for: "${prompt}"`,
          isPublic: isPublic,
          songs: playlist.map(t => t.id)
        })
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[DEBUG] Raw Response:', responseText);
        throw new Error(`Server returned non-JSON response: ${responseText.substring(0, 50)}...`);
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save playlist');
      }

      toast.success('Playlist saved to your library! 🎉');
      if (onSaveSuccess) onSaveSuccess();
      onClose();
    } catch (err) {
      console.error('[DEBUG] Save error:', err);
      toast.error(err.message, { duration: 5000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-2xl bg-slate-900/90 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-purple-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <i className="ri-magic-line text-white text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">AI Smart Playlist</h2>
              <p className="text-xs text-zinc-400 font-medium">Powered by Gemini AI</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-400 transition-colors"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!hasGenerated ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-white/5">
                <p className="text-sm text-zinc-300 leading-relaxed">
                  Tell the AI what kind of music you want. Try prompts like:
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {['Late night drive', 'Coding focus', 'Gym energy', 'Romantic dinner', 'Car playlist'].map(tag => (
                    <button 
                      key={tag}
                      onClick={() => setPrompt(tag)}
                      className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-slate-700/50 border border-white/5 text-zinc-400 hover:text-white hover:border-purple-500/50 transition-all"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleGenerate} className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Create a high-energy playlist for a long car drive with some Bollywood hits..."
                  className="w-full bg-slate-800/80 border border-white/10 rounded-2xl p-4 pr-12 min-h-[120px] text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none placeholder:text-zinc-600"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute bottom-4 right-4 w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-95"
                >
                  {loading ? (
                    <i className="ri-loader-4-line animate-spin text-xl"></i>
                  ) : (
                    <i className="ri-send-plane-fill text-xl"></i>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-slate-800/40 border border-white/5 rounded-3xl space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 tracking-[0.2em] ml-2 uppercase">Playlist Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-zinc-700"
                    placeholder="Enter catchy title..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 tracking-[0.2em] ml-2 uppercase">Playlist Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-zinc-400 focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-zinc-700"
                    placeholder="Enter short description..."
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Generated Tracks</h3>
                <button 
                  onClick={() => setHasGenerated(false)}
                  className="text-xs font-bold text-purple-400 hover:text-purple-300"
                >
                  <i className="ri-restart-line mr-1"></i> Try Again
                </button>
              </div>

              <div className="space-y-2">
                {playlist.map((track, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={track.id} 
                    className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-transparent hover:border-white/5 transition-all group"
                  >
                    <img src={track.image?.[0]?.url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{track.name}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{track.artists?.primary?.[0]?.name || track.subtitle}</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRemoveTrack(track.id); }}
                      className="opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:text-red-500 transition-opacity"
                      title="Remove from this playlist"
                    >
                      <i className="ri-delete-bin-line text-xl"></i>
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {hasGenerated && (
          <div className="p-6 border-t border-white/5 bg-slate-800/30 flex flex-col gap-4">
            {/* Public/Private Toggle */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <i className={isPublic ? "ri-global-line text-green-400" : "ri-lock-2-line text-amber-400"}></i>
                <span className="text-xs font-bold text-zinc-300">{isPublic ? 'Public Playlist' : 'Private Playlist'}</span>
              </div>
              <button 
                onClick={() => setIsPublic(!isPublic)}
                className={`w-12 h-6 rounded-full transition-all duration-300 relative ${isPublic ? 'bg-green-500' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${isPublic ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={playAll}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-2xl border border-white/10 transition-all active:scale-[0.98]"
              >
                <i className="ri-play-fill mr-2"></i> PLAY ALL
              </button>
              <button
                onClick={handleSavePlaylist}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black py-3 rounded-2xl shadow-xl shadow-purple-500/10 hover:shadow-purple-500/25 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? (
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                ) : (
                  <i className="ri-folder-add-fill mr-2"></i>
                )}
                SAVE TO LIBRARY
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AISmartPlaylist;
