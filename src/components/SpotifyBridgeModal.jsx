import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_BASE_URL from '../config/api';

const SpotifyBridgeModal = ({ onClose, onSuccess }) => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('input'); // input | analyzing | review
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDesc, setPlaylistDesc] = useState('');

  const isSpotify = url.includes('spotify.com');
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!isSpotify && !isYouTube) {
        return toast.error('Please enter a valid Spotify or YouTube playlist URL');
    }

    setLoading(true);
    setStatus('analyzing');
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/playlists/bridge/analyze`, { url }, { withCredentials: true });
      setResults(data);
      setPlaylistName(data.playlistName);
      setPlaylistDesc(`Imported via Bridge from ${isSpotify ? 'Spotify' : 'YouTube'}: ${url}`);
      setStatus('review');
      toast.success(`Found ${data.totalFound} matching tracks!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to analyze playlist. Is it public?');
      setStatus('input');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!playlistName.trim()) return toast.error('Please enter a playlist name');
    
    const songIds = results.tracks
      .filter(t => t.status === 'found')
      .map(t => t.match.id);

    if (songIds.length === 0) return toast.error('No matching tracks found to import');

    setCreating(true);
    try {
      await axios.post(`${API_BASE_URL}/api/playlists/bridge/create`, {
        name: playlistName,
        description: playlistDesc,
        songIds,
        isPublic
      }, { withCredentials: true });

      toast.success('Playlist Bridge Complete! 🎉');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create playlist');
    } finally {
      setCreating(false);
    }
  };

  const matchedTracks = results?.tracks?.filter(t => t.status === 'found') || [];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="w-full max-w-3xl bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(34,197,94,0.1)] flex flex-col max-h-[90vh] relative"
      >
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${isYouTube && !isSpotify ? 'from-red-500 to-rose-600' : 'from-green-500 to-emerald-600'}`}></div>

        {/* Header */}
        <div className={`p-8 border-b border-white/5 flex justify-between items-center ${status === 'input' ? 'bg-white/5' : isYouTube && !isSpotify ? 'bg-red-500/5' : 'bg-green-500/5'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${
              status === 'review' || status === 'analyzing'
                ? (isYouTube && !isSpotify ? 'bg-red-600 shadow-red-500/20' : 'bg-green-500 shadow-green-500/20')
                : 'bg-slate-800 shadow-black/40 border border-white/10'
            }`}>
              {status === 'input' ? (
                <div className="flex items-center -space-x-2">
                  <i className="ri-spotify-fill text-green-500 text-2xl"></i>
                  <i className="ri-youtube-fill text-red-600 text-2xl"></i>
                </div>
              ) : (
                <i className={`${isYouTube && !isSpotify ? 'ri-youtube-fill' : 'ri-spotify-fill'} text-slate-900 text-3xl`}></i>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Playlist Bridge</h2>
              <p className="text-[10px] text-zinc-500 font-black tracking-[0.2em] mt-1 uppercase">
                {status === 'input' ? 'Spotify • YouTube • JioSaavn' : 'Cross-Platform Sync'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 transition-colors"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {status === 'input' && (
              <motion.div 
                key="input"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="bg-slate-800/40 p-6 rounded-3xl border border-white/5 space-y-4">
                  <p className="text-sm text-zinc-300 font-medium leading-relaxed italic opacity-80">
                    "Connect your musical past with your current collection. Paste a public Spotify or YouTube link below, and we'll automatically find and match the tracks in our high-quality archive."
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[9px] font-black px-2.5 py-1 bg-white/5 rounded-full text-zinc-500 border border-white/5 uppercase tracking-widest">NO API KEY NEEDED</span>
                    <span className="text-[9px] font-black px-2.5 py-1 bg-white/5 rounded-full text-zinc-500 border border-white/5 uppercase tracking-widest">AUTO TRACK MATCHING</span>
                    <span className="text-[9px] font-black px-2.5 py-1 bg-blue-500/10 rounded-full text-blue-400 border border-blue-500/20 uppercase tracking-widest">UNLIMITED TRACKS</span>
                  </div>
                </div>

                <form onSubmit={handleAnalyze} className="space-y-4">
                  <div className="relative group">
                    <i className="ri-link absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 text-xl group-focus-within:text-green-500 transition-colors"></i>
                    <input 
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="Paste Spotify or YouTube playlist link..."
                      className="w-full bg-slate-900 border border-white/10 rounded-2xl py-5 pl-14 pr-14 text-white text-lg font-bold focus:outline-none focus:border-green-500/50 shadow-inner placeholder:text-zinc-700 transition-all"
                    />
                    {url && (
                      <button
                        type="button"
                        onClick={() => setUrl('')}
                        className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all shadow-lg active:scale-90"
                      >
                        <i className="ri-close-circle-fill text-xl"></i>
                      </button>
                    )}
                  </div>
                  <button 
                    type="submit"
                    disabled={!url.trim() || loading}
                    className={`w-full py-5 text-slate-900 font-black rounded-2xl hover:scale-[1.01] transition-all active:scale-95 shadow-xl uppercase tracking-widest text-sm ${isYouTube && !isSpotify ? 'bg-red-600 shadow-red-500/20' : 'bg-green-500 shadow-green-500/20'}`}
                  >
                    Analyze Collection
                  </button>
                </form>
              </motion.div>
            )}

            {status === 'analyzing' && (
              <motion.div 
                key="analyzing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center space-y-8"
              >
                <div className="relative">
                  <div className={`w-28 h-28 border-4 rounded-full animate-pulse ${isYouTube && !isSpotify ? 'border-red-500/10' : 'border-green-500/10'}`}></div>
                  <div className={`absolute inset-0 w-28 h-28 border-4 border-t-transparent rounded-full animate-spin duration-500 ${isYouTube && !isSpotify ? 'border-red-600' : 'border-green-500'}`}></div>
                  <i className={`${isYouTube && !isSpotify ? 'ri-youtube-fill text-red-600' : 'ri-spotify-fill text-green-500'} absolute inset-0 flex items-center justify-center text-5xl`}></i>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Deep Analysis In Progress</h3>
                  <p className="text-zinc-500 font-bold text-[10px] tracking-widest uppercase animate-pulse">Processing Large Playlist in Batches...</p>
                  <div className="flex items-center justify-center gap-2 text-zinc-600 text-[8px] font-bold uppercase tracking-[0.2em] mt-4 max-w-xs mx-auto">
                    <i className="ri-information-line text-sm"></i>
                    <span>This may take a minute for large collections. Please keep this window open.</span>
                  </div>
                </div>
              </motion.div>
            )}

            {status === 'review' && results && (
              <motion.div 
                key="review"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Meta Edit */}
                <div className="p-6 bg-slate-800/40 rounded-3xl border border-white/5 grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 tracking-widest ml-2 uppercase">Playlist Title</label>
                        <input 
                            type="text"
                            value={playlistName}
                            onChange={(e) => setPlaylistName(e.target.value)}
                            className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-green-500/30"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Match Review ({matchedTracks.length} / {results.totalProcessed})</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{isPublic ? 'Public' : 'Private'}</span>
                        <button 
                            onClick={() => setIsPublic(!isPublic)}
                            className={`w-10 h-5 rounded-full transition-all relative ${isPublic ? 'bg-green-500' : 'bg-slate-700'}`}
                        >
                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-md ${isPublic ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                   {results.tracks.map((item, idx) => (
                       <div 
                        key={idx} 
                        className={`group flex items-center justify-between p-3 rounded-2xl border transition-all ${
                            item.status === 'found' ? 'bg-slate-800/40 border-white/5 hover:border-blue-500/30' : 
                            item.status === 'error' ? 'bg-amber-500/5 border-amber-500/20 opacity-90' :
                            'bg-red-500/5 border-red-500/10 opacity-70'
                        }`}
                       >
                           <div className="flex items-center gap-4 min-w-0">
                               <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-700 flex-shrink-0 relative">
                                    <img src={item.status === 'found' ? item.match.image : item.originalTrack.image} className="w-full h-full object-cover" alt="" />
                                    {item.status === 'found' && (
                                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                            <i className="ri-check-line text-white font-black text-xl"></i>
                                        </div>
                                    )}
                               </div>
                               <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className={`text-sm font-bold truncate ${item.status === 'found' ? 'text-white' : 'text-zinc-500'}`}>{item.originalTrack.name}</h4>
                                        {item.status === 'missing' && <span className="text-[8px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-black uppercase">NOT FOUND</span>}
                                        {item.status === 'error' && <span className="text-[8px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-black uppercase">PROCESS ERROR</span>}
                                    </div>
                                    <p className="text-[10px] text-zinc-500 font-bold truncate uppercase tracking-tight">{Array.isArray(item.originalTrack.artist) ? item.originalTrack.artist.join(', ') : item.originalTrack.artist}</p>
                               </div>
                           </div>
                           {item.status === 'found' && (
                               <div className="text-right flex-shrink-0">
                                   <p className="text-[9px] text-blue-500 font-black uppercase tracking-widest leading-none">{item.confidence}% Match</p>
                                   <p className="text-[8px] text-zinc-600 font-bold mt-1 uppercase truncate max-w-[100px]">On JioSaavn</p>
                               </div>
                           )}
                       </div>
                   ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {status === 'review' && (
          <div className="p-8 bg-slate-800/50 border-t border-white/5 flex gap-4">
              <button 
                onClick={() => setStatus('input')}
                className="flex-1 py-4 bg-slate-700/50 text-white font-black rounded-2xl hover:bg-slate-700 transition-all active:scale-95 text-xs uppercase tracking-widest border border-white/5"
              >
                  Restart
              </button>
              <button 
                onClick={handleCreate}
                disabled={creating || matchedTracks.length === 0}
                className="flex-[2] py-4 bg-green-500 text-slate-900 font-black rounded-2xl hover:scale-[1.02] transition-all active:scale-95 shadow-xl shadow-green-500/20 text-xs uppercase tracking-widest flex items-center justify-center gap-3"
              >
                  {creating ? <i className="ri-loader-4-line animate-spin text-xl"></i> : <i className="ri-folder-add-fill text-xl"></i>}
                  Finalize Import
              </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SpotifyBridgeModal;
