import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import logo from "./../../public/logo3.jpg";
import Loading from "./Loading";
import Dropdown from "react-dropdown";
import "react-dropdown/style.css";
import wavs from "../../public/wavs.gif";
import wait from "../../public/wait.gif";
import { motion } from "framer-motion";
import { Circ } from "gsap/all";
import useLikedSongs from "../hooks/useLikedSongs";
import { usePlayer } from "../context/PlayerContext";
import { LANGUAGE_OPTIONS } from "../constants";
import { getHomeModules, searchSongs, getSongSuggestions } from "../services/api";

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

  function playMainSong(i) {
    playSong(details[i], i, details);
  }

  function playSuggSong(i) {
    playSong(suggSong[i], i, suggSong);
  }

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
    <div className="w-full h-screen  bg-slate-800">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ease: Circ.easeIn, duration: 0.5 }}
        className="logo fixed  z-[99] top-0 w-full  duration-700  max-h-[20vh]  flex sm:block backdrop-blur-xl py-3  px-10 sm:px-5  items-center gap-3 "
      >
        <div className="flex   items-center sm:justify-center sm:pt-2 gap-3">
          <img className="w-[5vw] sm:w-[10vw] rounded-full" src={logo} alt="" />
          <h1 className="text-2xl text-slate-900 p-2 rounded-full bg-neutral-500 sm:text-xl  font-black">
            THE ULTIMATE SONGS
          </h1>
        </div>
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ease: Circ.easeIn, duration: 1 }}
          className="sm:flex sm:pt-3 text-zinc-500   sm:justify-center"
        >
          <h3 className="inline text-xl sm:hidden">Search : </h3>
          <Link className=" text-xl sm:text-sm ml-3 sm:ml-0 sm:font-bold  p-1 rounded-md hover:text-black  hover:bg-neutral-500 duration-300 text-neutral-300  font-semibold " to={"/songs"}>Songs</Link>
          <Link className="  text-xl sm:text-sm ml-3 sm:ml-0 sm:font-bold  p-1 rounded-md hover:text-black  hover:bg-neutral-500 duration-300 text-neutral-300  font-semibold " to={"/playlist"}>PlayLists</Link>
          <Link className="  text-xl sm:text-sm ml-3 sm:ml-0 sm:font-bold  p-1 rounded-md hover:text-black  hover:bg-neutral-500 duration-300 text-neutral-300  font-semibold" to={"/artists"}>Artists</Link>
          <Link className="  text-xl sm:text-sm ml-3 sm:ml-0 sm:font-bold  p-1 rounded-md hover:text-black  hover:bg-neutral-500 duration-300 text-neutral-300  font-semibold " to={"/album"}>Album</Link>
          <Link className=" text-xl sm:text-sm ml-3 sm:ml-0 sm:font-bold  p-1 rounded-md hover:text-black  hover:bg-neutral-500 duration-300 text-neutral-300  font-semibold" to={"/likes"}>Likes</Link>
          <a target="_blank" href={"https://github.com/patelharsh80874/THE-ULTIMATE-SONGS-WEBAPP"} className="ml-4 sm:ml-2 cursor-pointer  text-3xl  text-zinc-500   ri-github-fill"></a>
        </motion.div>
      </motion.div>

      <div className="w-full  bg-slate-800  min-h-[63vh] pt-[20vh] pb-[30vh]   text-zinc-300 p-5 flex flex-col gap-5 overflow-auto ">
        <div className="w-full   flex justify-end ">
          <Dropdown
            className="w-[15%] text-sm sm:w-[50%]"
            options={LANGUAGE_OPTIONS}
            onChange={(e) => setLanguage(e.value)}
            placeholder={language ? ` ${language}  ` : "Select language"}
          />
        </div>

        <div className="trending songs flex flex-col gap-3 w-full ">
          <h3 className="text-xl h-[5vh] font-semibold">{language} Songs</h3>
          <motion.div className="songs px-5 sm:px-3 flex flex-shrink  gap-5 overflow-x-auto overflow-hidden w-full ">
            {details?.map((t, i) => (
              <motion.div
                initial={{ y: -100, scale: 0.5 }}
                whileInView={{ y: 0, scale: 1 }}
                transition={{ ease: Circ.easeIn, duration: 0.05 }}
                onClick={() => playMainSong(i)}
                key={i}
                className="relative hover:scale-90 sm:hover:scale-100  duration-150 flex-shrink-0 w-[15%] sm:w-[40%] rounded-md flex flex-col gap-1 py-4 cursor-pointer"
              >
                <motion.img className="relative w-full  rounded-md" src={t.image[2].url} alt="" />
                <div className="flex  items-center ">
                  <p className=" text-green-400">{i + 1}</p>
                </div>
                <img className={`absolute top-4 w-[20%] sm:w-[25%] rounded-md ${t.id === songlink[0]?.id ? "block" : "hidden"} `} src={wavs} alt="" />
                {songlink.length > 0 && (
                  <i className={`absolute top-20 sm:top-16 w-full  flex items-center justify-center text-5xl  opacity-90  duration-300 rounded-md  ${t.id === songlink[0]?.id ? "block" : "hidden"} ${isPlaying ? "ri-pause-circle-fill" : "ri-play-circle-fill"}`}></i>
                )}
                <motion.div className="flex flex-col">
                  <h3 className={`text-sm sm:text-xs leading-none  font-bold ${t.id === songlink[0]?.id && "text-green-300"}`}>{t.name}</h3>
                  <h4 className="text-xs sm:text-[2.5vw] text-zinc-300 ">{t.album.name}</h4>
                </motion.div>
                <i
                  title="Add to Queue"
                  onClick={(e) => { e.stopPropagation(); const added = addToQueue(t); if (added) toast.success(`Added to queue`, { duration: 1000 }); else toast(`Already in queue`, { icon: '⚠️', duration: 1000 }); }}
                  className="text-lg mt-1 duration-300 cursor-pointer text-zinc-400 hover:text-green-400 ri-play-list-add-line"
                ></i>
              </motion.div>
            ))}
            <img className={page >= 18 ? "hidden" : "w-[20%] h-[20%]"} src={wait} />
          </motion.div>
        </div>

        {suggSong.length > 0 && (
          <div className="trending songs flex flex-col gap-3 w-full ">
            <h3 className="text-xl h-[5vh] font-semibold">
              Songs for you <sub className="text-gray-400">(based on your liked songs)</sub>
            </h3>
            <motion.div className="songs px-5 sm:px-3 flex flex-shrink  gap-5 overflow-x-auto overflow-hidden w-full ">
              {suggSong?.map((t, i) => (
                <motion.div
                  initial={{ y: -100, scale: 0.5 }}
                  whileInView={{ y: 0, scale: 1 }}
                  transition={{ ease: Circ.easeIn, duration: 0.05 }}
                  onClick={() => playSuggSong(i)}
                  key={i}
                  className="relative hover:scale-90 sm:hover:scale-100  duration-150 flex-shrink-0 w-[15%] sm:w-[40%] rounded-md flex flex-col gap-1 py-4 cursor-pointer"
                >
                  <motion.img className="relative w-full  rounded-md" src={t.image[2].url} alt="" />
                  <div className="flex  items-center ">
                    <p className=" text-green-400">{i + 1}</p>
                  </div>
                  <img className={`absolute top-4 w-[20%] sm:w-[25%] rounded-md ${t.id === songlink[0]?.id ? "block" : "hidden"} `} src={wavs} alt="" />
                  {songlink.length > 0 && (
                    <i className={`absolute top-20 sm:top-16 w-full  flex items-center justify-center text-5xl  opacity-90  duration-300 rounded-md  ${t.id === songlink[0]?.id ? "block" : "hidden"} ${isPlaying ? "ri-pause-circle-fill" : "ri-play-circle-fill"}`}></i>
                  )}
                  <motion.div className="flex flex-col">
                    <h3 className={`text-sm sm:text-xs leading-none  font-bold ${t.id === songlink[0]?.id && "text-green-300"}`}>{t.name}</h3>
                    <h4 className="text-xs sm:text-[2.5vw] text-zinc-300 ">{t.album.name}</h4>
                  </motion.div>
                  <i
                    title="Add to Queue"
                    onClick={(e) => { e.stopPropagation(); const added = addToQueue(t); if (added) toast.success(`Added to queue`, { duration: 1000 }); else toast(`Already in queue`, { icon: '⚠️', duration: 1000 }); }}
                    className="text-lg mt-1 duration-300 cursor-pointer text-zinc-400 hover:text-green-400 ri-play-list-add-line"
                  ></i>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}

        <div className="charts w-full flex flex-col gap-3   ">
          <h3 className="text-xl h-[5vh] font-semibold">Charts</h3>
          <div className="chartsdata px-5 sm:px-3 flex flex-shrink  gap-5 overflow-x-auto overflow-hidden w-full ">
            {home?.charts?.map((c, i) => (
              <motion.div
                initial={{ y: -100, scale: 0.5 }}
                whileInView={{ y: 0, scale: 1 }}
                transition={{ ease: Circ.easeIn, duration: 0.05 }}
                onClick={() => navigate(`/playlist/details/${c.id}`)}
                key={i}
                className="hover:scale-110 sm:hover:scale-100  duration-150 flex-shrink-0 w-[15%] sm:w-[40%] rounded-md flex flex-col gap-2 py-4 cursor-pointer"
              >
                <img className="w-full  rounded-md" src={c.image[2].link} alt="" />
                <motion.h3 className="leading-none">{c.title}</motion.h3>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="playlists w-full  flex flex-col gap-3 ">
          <h3 className="text-xl h-[5vh] font-semibold">Playlists</h3>
          <div className="playlistsdata px-5 sm:px-3 flex flex-shrink  gap-5 overflow-x-auto overflow-hidden w-full ">
            {home?.playlists?.map((p, i) => (
              <motion.div
                initial={{ y: -100, scale: 0.5 }}
                whileInView={{ y: 0, scale: 1 }}
                transition={{ ease: Circ.easeIn, duration: 0.05 }}
                onClick={() => navigate(`/playlist/details/${p.id}`)}
                key={i}
                className="hover:scale-110  sm:hover:scale-100  duration-150 flex-shrink-0 w-[15%] sm:w-[40%] rounded-md  flex flex-col gap-2 py-4 cursor-pointer"
              >
                <img className="w-full  rounded-md" src={p.image[2].link} alt="" />
                <motion.h3 className="leading-none">{p.title}</motion.h3>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="albums w-full flex flex-col gap-3 ">
          <h3 className="text-xl h-[5vh] font-semibold">Albums</h3>
          <div className="albumsdata  px-5 sm:px-3 flex flex-shrink  gap-5 overflow-x-auto overflow-hidden w-full ">
            {home?.albums?.map((a, i) => (
              <motion.div
                initial={{ y: -100, scale: 0.5 }}
                whileInView={{ y: 0, scale: 1 }}
                transition={{ ease: Circ.easeIn, duration: 0.05 }}
                onClick={() => navigate(`/albums/details/${a.id}`)}
                key={i}
                className="hover:scale-110 sm:hover:scale-100  duration-150 flex-shrink-0 w-[15%] sm:w-[40%] rounded-md  flex flex-col gap-2 py-4 cursor-pointer"
              >
                <img className="w-full  rounded-md" src={a.image[2].link} alt="" />
                <motion.h3 className="leading-none">{a.name}</motion.h3>
              </motion.div>
            ))}
          </div>
        </div>
        <div>
          <p className="font-semibold text-neutral-400 sm:text-sm">
            All trademarks and copyrights belong to their respective owners. All
            media, images, and songs are the property of their respective
            owners. This site is for educational purposes only.
          </p>
        </div>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default Home;
