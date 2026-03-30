import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";
import wavs from "../../public/wavs.gif";
import empty from "../../public/empty3.gif";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import downloadSongsWithMetadataAsZip from "../utils/downloadSongsWithMetadataAsZip";
import useLikedSongs from "../hooks/useLikedSongs";
import { usePlayer } from "../context/PlayerContext";

const Likes = () => {
  const navigate = useNavigate();
  const { likedSongs, removeSong, loadLikedSongs } = useLikedSongs();
  const { playSong, songlink, isPlaying, addToQueue } = usePlayer();

  const [download, setDownload] = useState(false);
  const [songs, setSongs] = useState([]);

  // Sync songs for zip download
  useEffect(() => {
    const mappedSongs = likedSongs.map((item) => ({
      title: item?.name,
      url: item?.downloadUrl?.[4]?.url,
      image: item?.image?.[2]?.url,
      album: item?.album?.name,
      artist: item?.artists?.primary?.map((a) => a.name).join(","),
      year: item?.year,
    }));
    setSongs(mappedSongs);
  }, [likedSongs]);

  function emptyfile() {
    navigate("/");
    toast.success("Go to home page to get songs");
  }

  function downloadSongsfile() {
    const data = localStorage.getItem("likeData");
    if (!data) return;
    const password = prompt("Set a password for your export file 🔒:");
    if (!password) return;
    const encrypted = CryptoJS.AES.encrypt(data, password).toString();
    const blob = new Blob([encrypted], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "THE-ULTIMATE-SONGS-Likes.json";
    a.click();
    URL.revokeObjectURL(url);
    toast("Export successful! Remember your password for import.", {
      icon: "✅",
      duration: 2000,
      style: { borderRadius: "10px", background: "rgb(115 115 115)", color: "#fff" },
    });
  }

  return (
    <div className="w-full h-screen bg-slate-700 sm:h-full">
      <div className="w-full fixed z-[99] backdrop-blur-xl flex items-center gap-3 sm:h-[7vh] h-[10vh]">
        <i
          onClick={() => navigate(-1)}
          className="text-3xl cursor-pointer ml-5 bg-green-500 rounded-full ri-arrow-left-line"
        ></i>
        <h1 className="text-xl text-zinc-300 font-black">THE ULTIMATE SONGS</h1>
        <div className="ml-auto mr-5 flex gap-3 text-zinc-300">
          <button
            className=" hover:scale-90 sm:hover:scale-100 duration-300 inline-block w-fit h-fit sm:text-sm  rounded-md p-2 sm:p-0.5 font-semibold bg-slate-400 "
            onClick={() => downloadSongsWithMetadataAsZip(songs, setDownload)}
            disabled={download}
          >
            {download ? "downloading..." : "Download All Songs"}
          </button>
          <button
            className=" hover:scale-90 sm:hover:scale-100 duration-300 inline-block w-fit h-fit sm:text-sm  rounded-md p-2 sm:p-0.5 font-semibold bg-slate-400 "
            onClick={() => navigate("/import")}
          >
            Import songs
          </button>
          <button
            className=" hover:scale-90 sm:hover:scale-100 duration-300 inline-block w-fit h-fit sm:text-sm  rounded-md p-2 sm:p-0.5 font-semibold bg-slate-400 "
            onClick={downloadSongsfile}
          >
            Export songs
          </button>
        </div>
      </div>

      {likedSongs.length > 0 ? (
        <div className="flex w-full text-white p-10 pt-[15vh] pb-[30vh] sm:pt-[10vh] sm:pb-[35vh] sm:p-3 sm:gap-3 bg-slate-700 min-h-[60vh] overflow-y-auto  sm:block flex-wrap gap-5 justify-center ">
          {likedSongs?.map((d, i) => (
            <div
              title="click on song image or name to play the song"
              key={i}
              className="items-center justify-center relative hover:scale-95 sm:hover:scale-100 duration-150 w-[40%] flex mb-3 sm:mb-3 sm:w-full sm:flex sm:items-center sm:gap-3  rounded-md h-[10vw] sm:h-[15vh] cursor-pointer bg-slate-600  "
            >
              <div
                onClick={() => playSong(d, i, likedSongs)}
                className="flex w-[80%] items-center"
              >
                <motion.img
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7 }}
                  viewport={{ once: true }}
                  className="w-[10vw] h-[10vw] sm:h-[15vh] sm:w-[15vh] rounded-md"
                  src={d.image[2].url}
                  alt=""
                />
                <p className="pl-1 text-green-400">{i + 1}</p>
                <img
                  className={`absolute top-0 w-[8%] sm:w-[10%] rounded-md ${d.id === songlink[0]?.id ? "block" : "hidden"} `}
                  src={wavs}
                  alt=""
                />
                {songlink.length > 0 && (
                  <i
                    className={`absolute top-0 sm:h-[15vh] w-[10vw] h-full flex items-center justify-center text-5xl sm:w-[15vh]  opacity-90  duration-300 rounded-md ${d.id === songlink[0]?.id ? "block" : "hidden"} ${isPlaying ? "ri-pause-circle-fill" : "ri-play-circle-fill"}`}
                  ></i>
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

              <i
                title="Remove Song"
                onClick={() => removeSong(d.id)}
                className="m-auto flex w-[3vw] sm:w-[9vw] rounded-full justify-center items-center h-[3vw] sm:h-[9vw] text-xl bg-red-500  duration-300 cursor-pointer text-zinc-300 ri-dislike-fill"
              ></i>
            </div>
          ))}
        </div>
      ) : (
        <div
          onClick={() => emptyfile()}
          className="absolute w-[25%] sm:w-[60%] left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2  cursor-pointer"
        >
          <img className="rounded-md " src={empty} />
          <p className=" text-base font-bold text-zinc-300">
            it's empty , liked songs will be shown in this page
          </p>
        </div>
      )}
    </div>
  );
}

export default Likes;
