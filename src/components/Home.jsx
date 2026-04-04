import React, { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import logo from "./../../public/logo3.jpg";
import Loading from "./Loading";
import Dropdown from "react-dropdown";
import "react-dropdown/style.css";
import wavs from "../../public/wavs.gif";
import wait from "../../public/wait.gif";
import { AnimatePresence, motion } from "framer-motion";
import { Circ } from "gsap/all";
import useLikedSongs from "../hooks/useLikedSongs";
import { usePlayer } from "../context/PlayerContext";
import { AuthContext } from "../context/AuthContext";
import { LANGUAGE_OPTIONS } from "../constants";
import { getHomeModules, searchSongs, getSongSuggestions } from "../services/api";
import AddToPlaylistModal from "./AddToPlaylistModal";
import Tooltip from "./Tooltip";
import { useHistory } from "../hooks/useHistory";

// Premium Card Component for Songs (Defined OUTSIDE Home to prevent re-mounting)
const SongCard = ({ item, index, songlink, isPlaying, onPlay, addToQueue, setPlaylistModalSong }) => {
  const isCurrent = item.id === songlink[0]?.id;
  return (
    <motion.div
      initial={{ y: -100, scale: 0.5 }}
      whileInView={{ y: 0, scale: 1 }}
      transition={{ ease: Circ.easeIn, duration: 0.05 }}
      onClick={() => onPlay(index)}
      className="group w-[160px] sm:w-[130px] flex-shrink-0 bg-slate-700/30 hover:bg-slate-700/70 p-3 sm:p-2.5 rounded-xl cursor-pointer transition-all duration-300 border border-transparent hover:border-slate-500/30 flex flex-col"
    >
      <div className="relative w-full aspect-square rounded-md overflow-hidden mb-3 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
        <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src={item.image?.[2]?.url || item.image?.[1]?.url} alt={item.name} />
        
        {/* Play button overlay that appears on hover */}
        <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 flex items-center justify-center ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button className="w-12 h-12 rounded-full bg-green-500 text-black flex items-center justify-center shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 hover:bg-green-400">
            {isCurrent && isPlaying ? (
              <i className="ri-pause-fill text-2xl"></i>
            ) : (
              <i className="ri-play-fill text-2xl ml-1"></i>
            )}
          </button>
        </div>

        {/* Currently playing subtle animation overlay */}
        {isCurrent && (
          <div className="absolute top-2 left-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-md">
             <img className="w-4 h-4 opacity-90" src={wavs} alt="Playing" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex flex-col flex-1 justify-between">
        <div>
          <h3 className={`text-sm sm:text-xs font-bold truncate mb-1 ${isCurrent ? 'text-green-400' : 'text-white'}`}>
            {item.name}
          </h3>
          <h4 className="text-xs sm:text-[10px] text-zinc-400 truncate">
            {item.album?.name || item.subtitle || "Single"}
          </h4>
        </div>

        {/* Action buttons under the name */}
        <div className="flex gap-3 mt-2">
          <Tooltip text="Add to Queue">
            <i
              onClick={(e) => { e.stopPropagation(); const added = addToQueue(item); if (added) toast.success(`Added to queue`, { duration: 1000 }); else toast(`Already in queue`, { icon: '⚠️', duration: 1000 }); }}
              className="text-lg duration-300 cursor-pointer text-zinc-400 hover:text-green-400 ri-play-list-add-line"
            ></i>
          </Tooltip>
          <Tooltip text="Add to Playlist">
            <i
              onClick={(e) => { e.stopPropagation(); setPlaylistModalSong(item); }}
              className="text-lg duration-300 cursor-pointer text-zinc-400 hover:text-purple-400 ri-folder-add-line"
            ></i>
          </Tooltip>
        </div>
      </div>
    </motion.div>
  );
};

// Premium Card Component for Collections (Playlists/Albums/Charts)
const CollectionCard = ({ item, index, pathPrefix, navigate }) => {
  return (
    <motion.div
      initial={{ y: -100, scale: 0.5 }}
      whileInView={{ y: 0, scale: 1 }}
      transition={{ ease: Circ.easeIn, duration: 0.05 }}
      onClick={() => navigate(`${pathPrefix}${item.id}`)}
      className="group w-[160px] sm:w-[130px] flex-shrink-0 bg-slate-700/30 hover:bg-slate-700/70 p-3 sm:p-2.5 rounded-xl cursor-pointer transition-all duration-300 border border-transparent hover:border-slate-500/30 flex flex-col"
    >
      <div className="relative w-full aspect-square rounded-md overflow-hidden mb-3 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
        <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src={item.image?.[2]?.link || item.image?.[1]?.link} alt={item.title || item.name} />
        
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button className="w-12 h-12 rounded-full bg-green-500 text-black flex items-center justify-center shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 hover:bg-green-400">
            <i className="ri-play-fill text-2xl ml-1"></i>
          </button>
        </div>
      </div>

      <div className="min-w-0 flex flex-col flex-1">
        <h3 className="text-sm sm:text-xs font-bold text-white truncate mb-1">
          {item.title || item.name}
        </h3>
        <h4 className="text-xs sm:text-[10px] text-zinc-400 truncate">
          {item.subtitle || "Collection"}
        </h4>
      </div>
    </motion.div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [home, setHome] = useState(null);
  const [language, setLanguage] = useState("hindi");
  const [details, setDetails] = useState([]);
  const [suggSong, setSuggSong] = useState([]);
  let [page, setPage] = useState(1);
  let [page2, setPage2] = useState(Math.floor(Math.random() * 50));

  const { playSong, songlink, isPlaying, currentIndex, addToQueue } = usePlayer();
  const { isLiked, toggleLike } = useLikedSongs();
  const { historySongs, loading: historyLoading } = useHistory();
  const { user, logout, loading: authLoading } = useContext(AuthContext);

  const [playlistModalSong, setPlaylistModalSong] = useState(null);

  const getHome = async () => {
    resetState();
    try {
      const { data } = await getHomeModules(language);
      setHome(data.data);
    } catch (error) {
      console.log("error", error);
    }
  };

  const getDetails = async () => {
    try {
      const { data } = await searchSongs(
        language,
        language === "english" ? page : page2,
        20
      );
      const newData = data.data.results.filter(
        (newItem) => !details.some((prevItem) => prevItem.id === newItem.id)
      );
      setDetails((prev) => [...prev, ...newData]);
    } catch (error) {
      console.log("error", error);
    }
  };

  const playMainSong = (i) => {
    playSong(details[i], i, details);
  };

  const playSuggSong = (i) => {
    playSong(suggSong[i], i, suggSong);
  };

  function getRandomIds(ids, num) {
    const shuffled = ids.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
  }

  function processLikedSongIds() {
    const likedSongs = JSON.parse(localStorage.getItem("likeData")) || [];
    const songIds = likedSongs.map((song) => song.id);
    const uniqueSongIds = Array.from(new Set(songIds));
    const selectedIds =
      uniqueSongIds.length <= 10
        ? uniqueSongIds
        : getRandomIds(uniqueSongIds, 10);
    localStorage.setItem("selectedSongIds", JSON.stringify(selectedIds));
    fetchAllSongs();
    return selectedIds;
  }

  const fetchAllSongs = async () => {
    const storedSelectedSongIds =
      JSON.parse(localStorage.getItem("selectedSongIds")) || [];
    const seenSongs = new Set();
    for (const id of storedSelectedSongIds) {
      try {
        const response = await getSongSuggestions(id);
        const newSongs = response.data.data.filter((song) => {
          if (seenSongs.has(song.id)) return false;
          seenSongs.add(song.id);
          return true;
        });
        setSuggSong((prev) => [...prev, ...newSongs]);
      } catch (error) {
        console.error(`Error fetching data for ID ${id}:`, error);
      }
    }
  };

  function resetState() {
    setPage(1);
    setDetails([]);
    setSuggSong([]);
  }

  function seccall() {
    const intervalId = setInterval(() => {
      if (home === null) {
        getHome();
      }
    }, 1000);
    return intervalId;
  }

  function seccall2() {
    const intervalId2 = setInterval(
      () => {
        if (details.length >= 0 && page < 20) {
          setPage2(Math.floor(Math.random() * 50));
          setPage(page + 1);
          getDetails();
        }
      },
      page <= 2 ? 500 : 2000
    );
    return intervalId2;
  }

  useEffect(() => {
    const interval = seccall();
    return () => clearInterval(interval);
  }, [language, home]);

  useEffect(() => {
    getHome();
  }, [language]);

  useEffect(() => {
    const interval2 = seccall2();
    return () => clearInterval(interval2);
  }, [details, page, language]);

  useEffect(() => {
    processLikedSongIds();
  }, [language]);

  return details.length > 0 ? (
    <div className="w-full min-h-screen bg-slate-800">
      {/* ========== UPGRADED NAVBAR ========== */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ease: Circ.easeIn, duration: 0.5 }}
        className="fixed z-[99] top-0 w-full min-h-[10vh] sm:min-h-0 bg-slate-800/90 backdrop-blur-xl border-b border-white/5 py-4 px-8 sm:px-4 sm:py-3 flex sm:flex-col sm:gap-4 items-center gap-6 shadow-lg"
      >
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <img className="w-10 h-10 sm:w-8 sm:h-8 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.3)]" src={logo} alt="Logo" />
          <h1 className="text-xl sm:text-lg text-white font-black tracking-tight whitespace-nowrap" style={{textShadow: "0 0 10px rgba(34,197,94,0.3)"}}>
            ULTIMATE SONGS
          </h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ease: Circ.easeIn, duration: 0.8 }}
          className="flex-1 flex items-center justify-center gap-1.5 sm:flex-wrap sm:justify-center"
        >
          {/* Premium Pill Links */}
          {[
            { name: "Songs", path: "/songs", icon: "ri-music-2-fill", priority: "low" },
            { name: "Playlists", path: "/playlist", icon: "ri-play-list-2-fill", priority: "low" },
            { name: "Community", path: "/community", icon: "ri-global-line", priority: "high" },
            { name: "Artists", path: "/artists", icon: "ri-mic-2-fill", priority: "low" },
            { name: "Albums", path: "/album", icon: "ri-album-fill", priority: "low" },
            { name: "Likes", path: "/likes", icon: "ri-heart-3-fill", priority: "high" },
            ...(!authLoading && user ? [
              { name: "My Playlists", path: "/my-playlists", icon: "ri-folder-music-fill", priority: "high" }
            ] : [])
          ].map((link, index) => (
            <motion.div
              key={link.name}
              initial={{ opacity: 0, scale: 0.5, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 20, 
                delay: 0.1 + (index * 0.1)
              }}
              whileHover={{ 
    scale: 0.9,
    transition: { duration: 0.2 } // 👈 no delay here
  }}
              whileTap={{ scale: 0.9 }}
            >
              <Link
                to={link.path}
                className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1 rounded-full bg-slate-700/60 hover:bg-green-500 hover:text-black text-zinc-300 text-[11px] sm:text-xs font-bold transition-colors duration-300 border border-slate-600/50 hover:border-green-400 shadow-sm"
              >
                <i className={`${link.icon} text-lg`}></i>
                <span className="sm:hidden lg:inline">{link.name}</span>
              </Link>
            </motion.div>
          ))}

          
          <div className="w-[1px] h-6 bg-slate-600/50 mx-2 hidden md:block lg:block"></div>
          
          {authLoading ? (
            <div className="flex items-center gap-3 ml-auto sm:ml-0 sm:w-full sm:justify-center min-w-[120px]">
               <i className="ri-loader-4-line animate-spin text-green-500 text-xl"></i>
            </div>
          ) : user ? (
            <div className="flex items-center gap-2 ml-auto sm:ml-0 sm:w-full sm:justify-center">
              <Link 
                to={`/profile/${user.username}`}
                className="flex items-center gap-2 bg-green-500/5 hover:bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20 transition-all group/navprof"
              >
                <div className="w-5 h-5 rounded-md bg-green-500/20 flex items-center justify-center text-[10px] font-black text-green-400 uppercase group-hover/navprof:bg-green-500 group-hover/navprof:text-slate-950 transition-colors">
                  {user.username[0]}
                </div>
                <span className="text-green-400 font-bold text-[11px] whitespace-nowrap flex items-center gap-1.5">
                  Hi, {user.username}
                  <i className="ri-external-link-line text-[10px] opacity-50 group-hover/navprof:opacity-100 transition-opacity"></i>
                </span>
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="text-[10px] bg-purple-600/20 text-purple-400 border border-purple-500/30 px-2.5 py-1.5 rounded-full hover:bg-purple-600/40 font-bold transition-all whitespace-nowrap">
                  Admin
                </Link>
              )}
              <button 
                onClick={logout}
                className="text-[10px] bg-slate-700 text-white hover:bg-red-500/90 px-2.5 py-1.5 rounded-full font-bold transition-all border border-slate-600 hover:border-red-400"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-auto sm:ml-0 sm:w-full sm:justify-center">
              <Link to="/login" className="text-sm text-zinc-300 hover:text-white font-bold px-3 py-1.5 transition-all">Log in</Link>
              <Link to="/register" className="text-sm bg-white text-black font-black px-5 py-1.5 rounded-full hover:scale-105 transition-all shadow-md">Sign up</Link>
            </div>
          )}

        </motion.div>
      </motion.div>

      {/* ========== CONTENT ========== */}
      <div className="w-full pt-[20vh] sm:pt-[24vh] pb-[25vh] px-8 sm:px-4 flex flex-col gap-8 overflow-hidden">
        
        {/* Language Selector */}
        <div className="w-full flex justify-end">
          <div className="w-[200px] sm:w-[150px]">
            <Dropdown
              className="text-sm font-semibold text-black"
              options={LANGUAGE_OPTIONS}
              onChange={(e) => setLanguage(e.value)}
              placeholder={language ? `${language.charAt(0).toUpperCase() + language.slice(1)}` : "Select language"}
            />
          </div>
        </div>

        {/* Recently Played */}
        {!authLoading && user && historySongs.length > 0 && (
          <div className="flex flex-col gap-4 w-full">
            <h2 className="text-2xl sm:text-xl font-black text-white px-2 flex items-center gap-2">
              Recently Played <i className="ri-history-line text-green-500"></i>
            </h2>
            <div className="flex gap-4 sm:gap-3 overflow-x-auto pb-6 pt-2 px-2 scrollbar-hide snap-x">
              {historySongs.map((t, i) => (
                <div key={`history-${t.id || i}`} className="snap-start">
                  <SongCard
                    item={t}
                    index={i}
                    songlink={songlink}
                    isPlaying={isPlaying}
                    onPlay={() => playSong(t, i, historySongs)}
                    addToQueue={addToQueue}
                    setPlaylistModalSong={setPlaylistModalSong}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trending Songs */}
        <div className="flex flex-col gap-4 w-full">
          <h2 className="text-2xl sm:text-xl font-black text-white px-2">
            Trending <span className="text-green-400 capitalize">{language}</span>
          </h2>
          <div className="flex gap-4 sm:gap-3 overflow-x-auto pb-6 pt-2 px-2 scrollbar-hide snap-x">
            {details?.map((t, i) => (
              <div key={t.id || i} className="snap-start">
                <SongCard
                  item={t}
                  index={i}
                  songlink={songlink}
                  isPlaying={isPlaying}
                  onPlay={playMainSong}
                  addToQueue={addToQueue}
                  setPlaylistModalSong={setPlaylistModalSong}
                />
              </div>
            ))}
            {page < 18 && (
              <div className="flex items-center justify-center w-[160px] sm:w-[130px] flex-shrink-0">
                <img className="w-10 h-10 opacity-50" src={wait} alt="Loading..." />
              </div>
            )}
          </div>
        </div>

        {/* Suggested Songs */}
        {suggSong.length > 0 && (
          <div className="flex flex-col gap-4 w-full">
            <h2 className="text-2xl sm:text-xl font-black text-white px-2 flex items-baseline gap-2">
              Made For You
              <span className="text-sm font-semibold text-zinc-500">Based on your likes</span>
            </h2>
            <div className="flex gap-4 sm:gap-3 overflow-x-auto pb-6 pt-2 px-2 scrollbar-hide snap-x">
              {suggSong?.map((t, i) => (
                <div key={t.id || i} className="snap-start">
                  <SongCard
                    item={t}
                    index={i}
                    songlink={songlink}
                    isPlaying={isPlaying}
                    onPlay={playSuggSong}
                    addToQueue={addToQueue}
                    setPlaylistModalSong={setPlaylistModalSong}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="flex flex-col gap-4 w-full">
          <h2 className="text-2xl sm:text-xl font-black text-white px-2">Top Charts</h2>
          <div className="flex gap-4 sm:gap-3 overflow-x-auto pb-6 pt-2 px-2 scrollbar-hide snap-x">
            {home?.charts?.map((c, i) => (
              <div key={c.id || i} className="snap-start">
                <CollectionCard item={c} index={i} pathPrefix="/playlist/details/" navigate={navigate} />
              </div>
            ))}
          </div>
        </div>

        {/* Playlists */}
        <div className="flex flex-col gap-4 w-full">
          <h2 className="text-2xl sm:text-xl font-black text-white px-2">Curated Playlists</h2>
          <div className="flex gap-4 sm:gap-3 overflow-x-auto pb-6 pt-2 px-2 scrollbar-hide snap-x">
            {home?.playlists?.map((p, i) => (
              <div key={p.id || i} className="snap-start">
                <CollectionCard item={p} index={i} pathPrefix="/playlist/details/" navigate={navigate} />
              </div>
            ))}
          </div>
        </div>

        {/* Albums */}
        <div className="flex flex-col gap-4 w-full">
          <h2 className="text-2xl sm:text-xl font-black text-white px-2">Latest Albums</h2>
          <div className="flex gap-4 sm:gap-3 overflow-x-auto pb-6 pt-2 px-2 scrollbar-hide snap-x">
            {home?.albums?.map((a, i) => (
              <div key={a.id || i} className="snap-start">
                <CollectionCard item={a} index={i} pathPrefix="/albums/details/" navigate={navigate} />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        {/* Premium Developer Footer */}
        <footer className="mt-20 sm:mt-12 px-6 py-12 border-t border-white/5 mx-2 flex flex-col items-center gap-10">
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-black tracking-[0.3em] text-zinc-600 uppercase">Crafted by</span>
              <a 
                href="https://patelharsh.in" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-1"
              >
                <h2 className="text-2xl sm:text-lg font-black text-white hover:text-green-400 transition-colors tracking-tight uppercase italic">
                  Harsh Patel
                </h2>
                <div className="h-1 w-0 group-hover:w-full bg-green-500 transition-all duration-500 rounded-full"></div>
              </a>
            </div>

            {/* Social & Pro Links */}
            <div className="flex items-center gap-6 px-10 py-4 bg-slate-900/40 rounded-[2rem] border border-white/5 backdrop-blur-xl shadow-2xl">
              <Tooltip text="Instagram" position="top">
                <a href="https://instagram.com/patelharsh.in" target="_blank" rel="noopener noreferrer" className="text-xl text-zinc-500 hover:text-pink-500 transition-all hover:scale-110">
                  <i className="ri-instagram-line"></i>
                </a>
              </Tooltip>
              <Tooltip text="GitHub Profile" position="top">
                <a href="https://github.com/patelharsh80874" target="_blank" rel="noopener noreferrer" className="text-xl text-zinc-500 hover:text-white transition-all hover:scale-110">
                  <i className="ri-github-fill"></i>
                </a>
              </Tooltip>
              <Tooltip text="Contact Mail" position="top">
                <a href="mailto:patelharsh80874@yahoo.com" className="text-xl text-zinc-500 hover:text-amber-400 transition-all hover:scale-110">
                  <i className="ri-mail-line"></i>
                </a>
              </Tooltip>
              <div className="w-[1px] h-4 bg-white/10"></div>
              <Tooltip text="Portfolio" position="top">
                <a href="https://patelharsh.in" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-zinc-400 hover:text-white transition-all uppercase tracking-widest">
                  Website
                </a>
              </Tooltip>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 w-full max-w-4xl">
            <div className="flex flex-wrap justify-center gap-4 text-[9px] font-black text-zinc-600 tracking-widest uppercase">
              <a href="https://github.com/patelharsh80874/THE-ULTIMATE-SONGS-WEBAPP" target="_blank" rel="noopener noreferrer" className="hover:text-green-500 transition-colors flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-full border border-white/5">
                <i className="ri-star-line text-green-500"></i> Star on GitHub
              </a>
              <div className="bg-slate-900/50 px-4 py-2 rounded-full border border-white/5 flex items-center gap-2">
                <i className="ri-git-branch-line"></i> v2.0.0
              </div>
            </div>

            <p className="text-[10px] text-zinc-700 text-center leading-relaxed font-medium">
              All trademarks and copyrights belong to their respective owners. All media, images, and songs are the property of their respective owners. This site is for educational and portfolio purposes only.
            </p>
          </div>
        </footer>
      </div>

      {/* Add to Playlist Modal */}
      {playlistModalSong && (
        <AddToPlaylistModal
          song={playlistModalSong}
          onClose={() => setPlaylistModalSong(null)}
        />
      )}
    </div>
  ) : (
    <Loading />
  );
};

export default Home;
