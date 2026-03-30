import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import Loading from "./Loading";
import wavs from "../../public/wavs.gif";
import { motion } from "framer-motion";
import useLikedSongs from "../hooks/useLikedSongs";
import { usePlayer } from "../context/PlayerContext";
import { getPlaylistDetails } from "../services/api";

const PlaylistDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const finalid = location.pathname.split("/")[3];

  const [details, setDetails] = useState([]);
  const { playSong, songlink, isPlaying, addToQueue } = usePlayer();
  const { isLiked, toggleLike } = useLikedSongs();

  const fetchDetails = async () => {
    try {
      const { data } = await getPlaylistDetails(finalid);
      setDetails(data?.data?.songs);
    } catch (error) {
      console.log("error", error);
    }
  };

  function seccall() {
    const intervalId = setInterval(() => {
      if (details.length === 0) fetchDetails();
    }, 3000);
    return intervalId;
  }

  useEffect(() => {
    const interval = seccall();
    return () => clearInterval(interval);
  }, [details]);

  return details.length ? (
    <div className=" w-full h-screen  bg-slate-700">
      <div className="w-full fixed backdrop-blur-xl z-[99] flex items-center gap-3 sm:h-[7vh]  h-[10vh]">
        <i onClick={() => navigate(-1)} className="text-3xl cursor-pointer ml-5 bg-green-500 rounded-full ri-arrow-left-line"></i>
        <h1 className="text-xl text-zinc-300 font-black">THE ULTIMATE SONGS</h1>
      </div>

      <div className="flex w-full pt-[15vh] sm:pt-[10vh] pb-[25vh] sm:pb-[35vh] text-white p-10 sm:p-3 sm:gap-3 bg-slate-700 min-h-[65vh] overflow-y-auto  sm:block flex-wrap gap-5 justify-center ">
        {details?.map((d, i) => (
          <div
            title="click on song image or name to play the song"
            key={i}
            className="items-center justify-center relative hover:scale-95 sm:hover:scale-100 duration-150 w-[40%] flex mb-3 sm:mb-3 sm:w-full sm:flex sm:items-center sm:gap-3  rounded-md h-[10vw] sm:h-[15vh] cursor-pointer bg-slate-600  "
          >
            <div onClick={() => playSong(d, i, details)} className="flex w-[80%] items-center">
              <motion.img initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7 }} viewport={{ once: true }} className="w-[10vw] h-[10vw] sm:h-[15vh] sm:w-[15vh] rounded-md" src={d.image[2].url} alt="" />
              <p className="pl-1 text-green-400">{i + 1}</p>
              <img className={`absolute top-0 w-[8%] sm:w-[10%] rounded-md ${d.id === songlink[0]?.id ? "block" : "hidden"} `} src={wavs} alt="" />
              {songlink.length > 0 && (
                <i className={`absolute top-0 sm:h-[15vh] w-[10vw] h-full flex items-center justify-center text-5xl sm:w-[15vh]  opacity-90  duration-300 rounded-md ${d.id === songlink[0]?.id ? "block" : "hidden"} ${isPlaying ? "ri-pause-circle-fill" : "ri-play-circle-fill"}`}></i>
              )}
              <div className="ml-3 sm:ml-3 flex justify-center items-center gap-5 mt-2">
                <div className="flex flex-col">
                  <h3 className={`text-sm sm:text-xs leading-none  font-bold ${d.id === songlink[0]?.id && "text-green-300"}`}>{d.name}</h3>
                  <h4 className="text-xs sm:text-[2.5vw] text-zinc-300 ">{d.album.name}</h4>
                </div>
              </div>
            </div>

            <i
              title="Add to Queue"
              onClick={(e) => { e.stopPropagation(); const added = addToQueue(d); if (added) toast.success(`Added to queue`, { duration: 1000 }); else toast(`Already in queue`, { icon: '⚠️', duration: 1000 }); }}
              className="text-xl flex w-[3vw] sm:w-[9vw] rounded-full justify-center items-center h-[3vw] sm:h-[9vw] duration-300 cursor-pointer text-zinc-300 hover:text-green-400 ri-play-list-add-line"
            ></i>
            {isLiked(d?.id) ? (
              <i onClick={() => toggleLike(d)} className={`text-xl m-auto flex w-[3vw] sm:w-[9vw] rounded-full justify-center items-center h-[3vw] sm:h-[9vw]    duration-300 cursor-pointer text-red-500  ri-heart-3-fill`}></i>
            ) : (
              <i onClick={() => toggleLike(d)} className={`text-xl m-auto flex w-[3vw] sm:w-[9vw] rounded-full justify-center items-center h-[3vw] sm:h-[9vw]   duration-300 cursor-pointer text-zinc-300  ri-heart-3-fill`}></i>
            )}
          </div>
        ))}
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default PlaylistDetails;

