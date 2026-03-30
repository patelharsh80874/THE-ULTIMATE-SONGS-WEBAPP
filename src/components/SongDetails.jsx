import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Loading from "./Loading";
import wavs from "../../public/wavs.gif";
import noimg from "../../public/noimg.png";
import { motion } from "framer-motion";
import { Circ } from "gsap/all";
import toast, { Toaster } from "react-hot-toast";
import useLikedSongs from "../hooks/useLikedSongs";
import { usePlayer } from "../context/PlayerContext";
import { getSongSuggestions, getSongDetails } from "../services/api";

const SongDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState([]);
  const [song, setSong] = useState([]);

  const { playSong, songlink, isPlaying } = usePlayer();
  const { isLiked, toggleLike } = useLikedSongs();

  const fetchSuggestions = async () => {
    try {
      const { data } = await getSongSuggestions(id);
      setDetails(data?.data);
    } catch (error) {
      console.log("error", error);
    }
  };

  const fetchSong = async () => {
    try {
      const { data } = await getSongDetails(id);
      setSong(data?.data);
    } catch (error) {
      console.log("error", error);
    }
  };

  function seccall() {
    const intervalId = setInterval(() => {
      if (details.length === 0 && song.length === 0) {
        fetchSuggestions();
        fetchSong();
      }
    }, 3000);
    return intervalId;
  }

  useEffect(() => {
    const interval = seccall();
    return () => clearInterval(interval);
  }, [details, song]);

  return details.length ? (
    <div className="w-full h-screen  bg-slate-700">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="w-full flex items-center gap-3 sm:h-[7vh]  h-[10vh]">
        <i
          onClick={() => navigate(-1)}
          className="text-3xl cursor-pointer ml-5 bg-green-500 rounded-full ri-arrow-left-line"
        ></i>
        <h1 className="text-xl text-zinc-300 font-black">THE ULTIMATE SONGS</h1>
      </div>
      <div className="px-7 w-full h-[65vh] overflow-hidden overflow-y-auto">
        {song?.map((e, i) => (
          <div
            key={i}
            className="w-full p-3 h-[50vh]  sm:min-h-fit flex sm:block gap-3 "
          >
            <div className="w-[20%] sm:w-[70%] h-full sm:h-[50%]">
              <img
                className="w-full h-full rounded-md"
                src={e.image[2].url}
                alt=""
              />
            </div>
            <div className="w-[80%] sm:w-full flex flex-col gap-1 h-full text-zinc-300 ">
              <p className="text-3xl flex  gap-5  font-bold text-zinc-100">
                {e.name}
                <i
                  onClick={() => toggleLike(e)}
                  className={`text-xl w-[3vw] sm:w-[9vw] rounded-full h-[3vw] sm:h-[9vw] duration-300 cursor-pointer ${
                    isLiked(e?.id) ? "text-red-500" : "text-zinc-300"
                  } ri-heart-3-fill`}
                ></i>
              </p>
              <p
                onClick={() => navigate(`/albums/details/${e.album.id}`)}
                className="text-lg font-semibold cursor-pointer"
              >
                {e.album.name}
              </p>
              <p className="text-xl">
                {e.type} - {Math.floor(e.duration / 60) + " min"} - {e.language}{" "}
                - {e.year}
              </p>
              <p>{e.copyright}</p>
            </div>
          </div>
        ))}

        <div className="playlists w-full mt-3  flex flex-col gap-3 text-zinc-300 ">
          <h3 className="text-xl h-[5vh] font-semibold">Artists</h3>
          <div className="playlistsdata px-5 sm:px-3 flex flex-shrink  gap-5 overflow-x-auto overflow-hidden w-full ">
            {song[0]?.artists?.primary?.map((p, i) => (
              <motion.div
                initial={{ y: -100, scale: 0.5 }}
                whileInView={{ y: 0, scale: 1 }}
                transition={{ ease: Circ.easeIn, duration: 0.05 }}
                onClick={() => navigate(`/artists/details/${p.id}`)}
                key={i}
                className="hover:scale-110  sm:hover:scale-100  duration-150 flex-shrink-0 w-[15%] sm:w-[40%] rounded-md  flex flex-col gap-2 py-4 cursor-pointer"
              >
                <img
                  className="w-full  rounded-md"
                  src={p?.image[2]?.url || noimg}
                  alt=""
                />
                <motion.h3 className="leading-none">{p.name}</motion.h3>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="trending songs flex flex-col gap-3 w-full  text-zinc-300 ">
          <h3 className="text-xl h-[5vh] font-semibold">Similar Songs</h3>
          <motion.div className="songs px-5 sm:px-3 flex flex-shrink  gap-5 overflow-x-auto overflow-hidden w-full ">
            {details?.map((t, i) => (
              <motion.div
                initial={{ y: -100, scale: 0.5 }}
                whileInView={{ y: 0, scale: 1 }}
                transition={{ ease: Circ.easeIn, duration: 0.05 }}
                onClick={() => playSong(t, i, details)}
                key={i}
                className="relative hover:scale-90 sm:hover:scale-100  duration-150 flex-shrink-0 w-[15%] sm:w-[40%] rounded-md flex flex-col gap-2 py-4 cursor-pointer"
              >
                <motion.img
                  className="relative w-full  rounded-md"
                  src={t.image[2].url}
                  alt=""
                />
                <img
                  className={`absolute top-4 w-[20%] sm:w-[25%] rounded-md ${
                    t.id === songlink[0]?.id ? "block" : "hidden"
                  } `}
                  src={wavs}
                  alt=""
                />
                <motion.div className="flex flex-col">
                  <h3
                    className={`text-sm sm:text-xs leading-none  font-bold ${
                      t.id === songlink[0]?.id && "text-green-300"
                    }`}
                  >
                    {t.name}
                  </h3>
                  <h4 className="text-xs sm:text-[2.5vw] text-zinc-300 ">
                    {t.album.name}
                  </h4>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default SongDetails;
