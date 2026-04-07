import React, { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Loading from "./Loading";
import InfiniteScroll from "react-infinite-scroll-component";
import wavs from "../../public/wavs.gif";
import noimg from "../../public/noimg.png";
import { motion, AnimatePresence } from "framer-motion";
import { Circ } from "gsap/all";
import useLikedSongs from "../hooks/useLikedSongs";
import { usePlayer } from "../context/PlayerContext";
import { getDetailedLabel, getSongsDetails, getSongDetails } from "../services/api";
import AddToPlaylistModal from "./AddToPlaylistModal";
import Tooltip from "./Tooltip";
import { LANGUAGE_OPTIONS } from "../constants";

// Helper to fix image quality from raw saavn strings/arrays
const getHighResImage = (imgData) => {
  if (!imgData) return noimg;
  if (typeof imgData === 'string') {
    return imgData.replace("150x150", "500x500").replace("120x120", "500x500").replace("50x50", "500x500");
  }
  // If it's the normalized array [{url: ...}, ...]
  return imgData?.[2]?.url || imgData?.[1]?.url || imgData?.[0]?.url || noimg;
};

const CustomDropdown = ({ options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative z-[60]" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/90 text-white text-[10px] sm:text-[9px] font-black tracking-widest uppercase px-4 py-2 rounded-full border border-white/10 hover:border-green-500/50 transition-all shadow-lg backdrop-blur-md"
      >
        <span>{selectedOption?.label || value}</span>
        <i className={`ri-arrow-down-s-line transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-48 max-h-60 overflow-y-auto bg-slate-900/95 border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex flex-col py-2 custom-scrollbar"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`text-left px-4 py-2 text-[10px] font-bold tracking-widest uppercase transition-colors ${value === opt.value ? 'bg-green-500 text-slate-900' : 'text-zinc-400 hover:bg-slate-800 hover:text-white'}`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LabelDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = location.pathname.split("/")[2];

  const [labelInfo, setLabelInfo] = useState(null);
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState("songs");
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState("hindi");
  const [selectedCategory, setSelectedCategory] = useState("popularity");
  const [sortOrder, setSortOrder] = useState("desc");

  const { playSong, songlink, isPlaying, addToQueue, setHasRadioQueue } = usePlayer();
  const { isLiked, toggleLike } = useLikedSongs();
  const [playlistModalSong, setPlaylistModalSong] = useState(null);
  const [bridgingId, setBridgingId] = useState(null);

  const fetchDetails = async (isLoadMore = false) => {
    try {
      const data = await getDetailedLabel(
        token, 
        isLoadMore ? page : 0, 
        20, 
        20, 
        selectedCategory, 
        sortOrder, 
        selectedLanguage
      );
      
      const { name, image, topSongs, topAlbums, availableLanguages: apiLangs } = data;
      const rawSongs = topSongs?.songs || [];
      const newAlbums = topAlbums?.albums || [];

      // Set Label Info immediately so the UI doesn't look empty
      if (!isLoadMore) {
        setLabelInfo({ 
          name, 
          image: getHighResImage(image), 
          totalSongs: topSongs?.total || 0, 
          totalAlbums: topAlbums?.total || 0 
        });
        if (apiLangs && Array.isArray(apiLangs)) setAvailableLanguages(apiLangs);
        setAlbums(newAlbums);
        setSongs(rawSongs); // Set raw songs first, then enhance them
      } else {
        setAlbums((prev) => [...prev, ...newAlbums.filter(n => !prev.some(p => p.id === n.id))]);
        setSongs((prev) => [...prev, ...rawSongs.filter(n => !prev.some(p => p.id === n.id))]);
      }

      // Pre-fetch enhancements (if any)
      if (rawSongs.length > 0) {
          try {
              const ids = rawSongs.map(s => s.id).join(",");
              const fullRes = await getSongsDetails(ids);
              const fullSongsDetails = fullRes.data.data || [];
              
              if (fullSongsDetails.length > 0) {
                  setSongs(prev => {
                      const updated = [...prev];
                      fullSongsDetails.forEach(full => {
                          const idx = updated.findIndex(s => String(s.id) === String(full.id));
                          if (idx !== -1) updated[idx] = full;
                      });
                      return updated;
                  });
              }
          } catch (EnhanceError) {
              console.warn("Song enhancement batch fetch failed, falling back to raw items:", EnhanceError);
              // We already set rawSongs, so it's fine.
          }
      }
      
      const currentNewDataLength = activeTab === "songs" ? rawSongs.length : newAlbums.length;
      setHasMore(currentNewDataLength > 0);
      setPage(isLoadMore ? page + 1 : 1);

    } catch (error) {
      console.error("Error fetching label details:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = async (song, index) => {
    // Check if we have the full song object (with downloadUrl)
    if (song.downloadUrl) {
      setHasRadioQueue(false);
      const queueSongs = songs.slice(index);
      playSong(song, 0, queueSongs);
      return;
    }

    // Otherwise, we need to bridge (fetch full details)
    setBridgingId(song.id);
    const loadingToast = toast.loading("Fetching high quality track...", {
        style: { borderRadius: '10px', background: '#333', color: '#fff' }
    });

    try {
      const response = await getSongDetails(song.id);
      const fullSong = response.data.data?.[0];

      if (fullSong) {
        toast.success("Ready!", { id: loadingToast });
        // Replace in list so next time it's instant
        const updatedSongs = [...songs];
        updatedSongs[index] = fullSong;
        setSongs(updatedSongs);

        setHasRadioQueue(false);
        const queueSongs = updatedSongs.slice(index);
        playSong(fullSong, 0, queueSongs);
      } else {
        toast.error("Could not fetch media link", { id: loadingToast });
      }
    } catch (err) {
        console.error("Playback bridge error:", err);
        toast.error("Playback failed!", { id: loadingToast });
    } finally {
      setBridgingId(null);
    }
  };

  useEffect(() => {
    setLoading(true);
    setPage(0);
    setSongs([]);
    setAlbums([]);
    fetchDetails(false);
    window.scrollTo(0, 0);
  }, [token, selectedLanguage, selectedCategory, sortOrder]);

  if (loading && page === 0) return <Loading />;

  const languageOptions = availableLanguages.length > 0 
    ? availableLanguages.map(l => ({ value: l, label: l.toUpperCase() }))
    : LANGUAGE_OPTIONS.map(l => ({ value: l, label: l.toUpperCase() }));

  return (
    <div className="w-full min-h-screen bg-slate-900 text-zinc-300 pb-32 overflow-x-hidden">
      
      {/* Dynamic Background Blur */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 opacity-20 scale-110 blur-[100px]"
          style={{ 
            backgroundImage: `url(${labelInfo?.image || noimg})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/90 to-slate-900" />
      </div>

      {/* Persistent Header */}
      <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-slate-900/40 border-b border-white/5 h-[10vh] sm:h-[8vh] px-6 sm:px-4 flex items-center gap-4">
        <Tooltip text="Go Back" position="bottom">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-slate-900 hover:scale-110 transition-transform shadow-lg shadow-green-500/20 active:scale-95"
          >
            <i className="ri-arrow-left-line text-2xl font-bold"></i>
          </button>
        </Tooltip>
        <div className="flex flex-col">
          <h1 className="text-lg sm:text-base text-white font-black tracking-tight leading-none uppercase">
            {labelInfo?.name || "LABEL"}
          </h1>
          <span className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] ml-0.5">LABEL DISCOGRAPHY</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 pt-[12vh] px-8 sm:px-4 max-w-7xl mx-auto">
        
        {/* Hero Section */}
        <div className="flex sm:flex-col gap-10 sm:gap-6 items-center mb-10 sm:mb-8 text-center sm:text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative flex-shrink-0"
          >
            <div className="w-56 h-56 sm:w-48 sm:h-48 rounded-full overflow-hidden border-4 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-slate-800 relative group">
               <img
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                src={labelInfo?.image || noimg}
                alt={labelInfo?.name}
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]"></div>
            </div>
            <button 
              onClick={() => {
                if (songs.length > 0) handlePlaySong(songs[0], 0);
              }}
              className="absolute bottom-2 right-2 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-slate-900 text-3xl shadow-2xl hover:scale-110 active:scale-90 transition-transform shadow-green-500/30"
            >
              <i className="ri-play-fill ml-1"></i>
            </button>
          </motion.div>

          <div className="flex-1 flex flex-col items-center sm:items-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-5xl sm:text-2xl font-black text-white tracking-tighter leading-tight drop-shadow-2xl uppercase">
                {labelInfo?.name}
              </h2>
              <div className="flex items-center gap-3 mt-4 sm:mt-3 text-zinc-400 font-bold justify-center">
                <span className="bg-slate-800 px-4 py-1.5 rounded-full text-[10px] border border-white/10 uppercase tracking-widest text-green-400 flex items-center gap-1.5">
                  <i className="ri-checkbox-circle-fill text-sm"></i>
                  Verified Label
                </span>
              </div>
              
              <div className="flex items-center justify-center gap-4 mt-4 font-black tracking-widest text-[10px] text-zinc-500 uppercase">
                <span>{labelInfo?.totalSongs} Tracks</span>
                <div className="w-1.5 h-1.5 bg-slate-700 rounded-full"></div>
                <span>{labelInfo?.totalAlbums} Albums</span>
              </div>

              {/* Advanced Filters */}
              <div className="flex flex-wrap justify-center gap-3 mt-8">
                <CustomDropdown 
                  value={selectedLanguage}
                  onChange={setSelectedLanguage}
                  options={languageOptions}
                />
                <CustomDropdown 
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  options={[
                    { value: "popularity", label: "POPULARITY" },
                    { value: "latest", label: "NEW RELEASES" },
                    { value: "alphabetical", label: "ALPHABETICAL" }
                  ]}
                />
                <CustomDropdown 
                  value={sortOrder}
                  onChange={setSortOrder}
                  options={[
                    { value: "desc", label: "DESCENDING" },
                    { value: "asc", label: "ASCENDING" }
                  ]}
                />
              </div>

              {/* Tabs */}
              <div className="flex items-center justify-center gap-10 sm:gap-6 mt-10 border-b border-white/5 w-full pb-3">
                <button 
                  onClick={() => { setActiveTab("songs"); setHasMore(true); }}
                  className={`text-xs font-black tracking-[0.3em] uppercase transition-all relative ${activeTab === 'songs' ? 'text-green-500' : 'text-zinc-600 hover:text-white'}`}
                >
                  TOP TRACKS
                  {activeTab === 'songs' && (
                    <motion.div layoutId="tab-underline" className="absolute -bottom-3 left-0 right-0 h-0.5 bg-green-500" />
                  )}
                </button>
                <button 
                  onClick={() => { setActiveTab("albums"); setHasMore(true); }}
                  className={`text-xs font-black tracking-[0.3em] uppercase transition-all relative ${activeTab === 'albums' ? 'text-green-500' : 'text-zinc-600 hover:text-white'}`}
                >
                  FEATURED ALBUMS
                  {activeTab === 'albums' && (
                    <motion.div layoutId="tab-underline" className="absolute -bottom-3 left-0 right-0 h-0.5 bg-green-500" />
                  )}
                </button>
              </div>

            </motion.div>
          </div>
        </div>

        {/* Dynamic List Section */}
        <InfiniteScroll
          dataLength={activeTab === 'songs' ? songs.length : albums.length}
          next={() => fetchDetails(true)}
          hasMore={hasMore}
          scrollThreshold={0.9}
          loader={
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Loading Content</p>
            </div>
          }
          endMessage={
            <div className="py-20 text-center opacity-40">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 line-through">End of Discography</p>
            </div>
          }
        >
          {activeTab === 'songs' ? (
            <div className="space-y-2 pb-20">
              {songs.map((song, i) => {
                const isActive = String(song.id) === String(songlink[0]?.id);
                const isBridging = bridgingId === song.id;
                
                return (
                  <motion.div 
                    key={song.id || i}
                    initial={{ opacity: 0, y: 15 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: i * 0.03 }} 
                    onClick={() => handlePlaySong(song, i)}
                    className={`group flex items-center gap-4 sm:gap-2 p-3 sm:p-2 rounded-xl cursor-pointer transition-all duration-200 border relative hover:z-[70] ${
                      isActive 
                        ? "bg-green-500/10 border-green-500/30 shadow-lg shadow-green-500/5 z-[65]" 
                        : "bg-slate-800/40 border-white/5 hover:bg-slate-800/60 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Index / Playing Indicator */}
                      <div className="w-6 sm:w-5 text-center flex-shrink-0">
                        {isActive && isPlaying ? (
                          <img src={wavs} alt="" className="w-4 h-4 sm:w-3 sm:h-3 mx-auto" />
                        ) : isBridging ? (
                          <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        ) : (
                          <span className="text-[10px] sm:text-[9px] font-bold text-zinc-500 group-hover:text-green-400 transition-colors uppercase tracking-widest">{i + 1}</span>
                        )}
                      </div>
  
                      {/* Track Cover */}
                      <div className="w-12 h-12 sm:w-10 sm:h-10 rounded-lg overflow-hidden flex-shrink-0 relative shadow-md bg-slate-800">
                        <img 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                          src={getHighResImage(song.image)} 
                          alt={song.title || song.name} 
                          onError={(e) => { e.target.src = noimg; }}
                        />
                        {isActive && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <i className={`text-xl text-white ${isPlaying ? "ri-pause-fill" : "ri-play-fill"}`}></i>
                          </div>
                        )}
                      </div>
  
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm sm:text-xs font-bold truncate ${isActive ? "text-green-400 font-black" : "text-white"}`}>
                          {song.title || song.name}
                        </h3>
                        <p className="text-xs sm:text-[10px] text-zinc-500 font-medium truncate mt-0.5">
                          {song.more_info?.album || song.album?.name || "Single"} · {song.more_info?.artistMap?.primary_artists?.[0]?.name || song.artists?.primary?.[0]?.name || "Unknown"}
                        </p>
                      </div>
                    </div>
  
                    {/* Action Tray */}
                    <div className="flex items-center gap-1 flex-shrink-0 transition-opacity">
                      <Tooltip text="Add to Queue">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            const added = addToQueue(song); 
                            if (added) toast.success("Added to queue"); 
                            else toast("Already in queue", { icon: "⚠️" }); 
                          }}
                          className="w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-green-400 hover:bg-green-500/10 transition-all font-bold"
                        >
                          <i className="ri-play-list-add-line text-lg sm:text-base"></i>
                        </button>
                      </Tooltip>
                      <Tooltip text={isLiked(song?.id) ? "Unlike" : "Like"}>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            toggleLike(song); 
                          }}
                          className={`w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
                            isLiked(song?.id) ? "text-red-500" : "text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                          }`}
                        >
                          <i className={`${isLiked(song?.id) ? "ri-heart-3-fill" : "ri-heart-3-line"} text-lg sm:text-base`}></i>
                        </button>
                      </Tooltip>
                      <Tooltip text="Add to Playlist">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setPlaylistModalSong(song); 
                          }}
                          className="w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
                        >
                          <i className="ri-folder-add-line text-lg sm:text-base"></i>
                        </button>
                      </Tooltip>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 sm:gap-3 pb-20">
              {albums.map((album, i) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i % 6 * 0.05 }}
                  key={album.id || i}
                >
                    <Link 
                        to={`/albums/details/${album.id}`} 
                        className="group flex flex-col gap-3 p-3 sm:p-2.5 rounded-2xl bg-slate-800/20 border border-white/5 hover:bg-slate-800/40 hover:border-white/10 transition-all duration-500 shadow-lg"
                    >
                        <div className="w-full aspect-square rounded-[1.25rem] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.4)] relative">
                        <img 
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                            src={getHighResImage(album.image)} 
                            alt={album.title} 
                            onError={(e) => { e.target.src = noimg; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300">
                                <i className="ri-play-fill text-3xl text-slate-900 ml-1"></i>
                            </div>
                        </div>
                        </div>
                        <div className="min-w-0 px-1">
                        <h4 className="text-[13px] font-black text-white truncate group-hover:text-green-400 transition-colors">{album.title || album.name}</h4>
                        <div className="flex items-center gap-2 mt-1 opacity-60">
                            <span className="text-[10px] font-bold tracking-widest text-zinc-400 truncate">{album.year}</span>
                            {album.subtitle && (
                                <>
                                    <div className="w-1 h-1 bg-zinc-600 rounded-full flex-shrink-0"></div>
                                    <span className="text-[10px] font-bold tracking-widest text-zinc-400 truncate uppercase">{album.subtitle}</span>
                                </>
                            )}
                        </div>
                        </div>
                    </Link>
                </motion.div>
              ))}
            </div>
          )}
        </InfiniteScroll>
      </div>

      {playlistModalSong && (
          <AddToPlaylistModal 
          songs={playlistModalSong} 
          onClose={() => setPlaylistModalSong(null)} 
          />
      )}
    </div>
  );
};

export default LabelDetails;
