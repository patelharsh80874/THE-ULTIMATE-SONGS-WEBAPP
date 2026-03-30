import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Circ } from "gsap/all";
import { usePlayer } from "../context/PlayerContext";
import useLikedSongs from "../hooks/useLikedSongs";
import handleGenerateAudio from "../utils/audioUtils";
import handleGenerateAudio2 from "../utils/audioUtils2";
import Queue from "./Queue";

const PlayerBar = () => {
  const {
    songlink,
    currentIndex,
    isPlaying,
    setIsPlaying,
    audioRef,
    next,
    previous,
    songsList,
  } = usePlayer();

  const { isLiked, toggleLike } = useLikedSongs();
  const [showQueue, setShowQueue] = useState(false);

  if (songlink.length === 0) return null;

  return (
    <>
      {/* Queue Panel */}
      <AnimatePresence>
        {showQueue && <Queue onClose={() => setShowQueue(false)} />}
      </AnimatePresence>

      <motion.div
        className="duration-700 fixed z-[99] bottom-0 flex gap-3 items-center w-full py-3 backdrop-blur-xl"
      >
        {songlink.map((e, i) => (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ ease: Circ.easeIn, duration: 0.7 }}
            key={e?.id || i}
            className="flex sm:block w-full sm:w-full sm:h-full items-center justify-center gap-3"
          >
            {/* Song Info */}
            <motion.div
              initial={{ x: -100, opacity: 0, scale: 0 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              className="w-[25vw] sm:w-full flex gap-3 items-center sm:justify-center rounded-md h-[7vw] sm:h-[30vw]"
            >
              <p className="text-green-400">{currentIndex + 1}</p>
              <motion.img
                initial={{ x: -100, opacity: 0, scale: 0 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                className="rounded-md h-[7vw] sm:h-[25vw]"
                src={e?.image?.[2]?.url}
                alt=""
              />
              <h3 className="sm:w-[30%] text-white text-xs font-semibold">
                {e?.name}
              </h3>
              <i
                onClick={() => toggleLike(e)}
                className={`text-xl hover:scale-150 sm:hover:scale-100 duration-300 cursor-pointer ${
                  isLiked(e?.id) ? "text-red-500" : "text-zinc-300"
                } ri-heart-3-fill`}
              ></i>
            </motion.div>

            {/* Audio Controls */}
            <motion.div
              initial={{ y: 100, opacity: 0, scale: 0 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              className="w-[35%] sm:w-full h-[10vh] flex gap-3 sm:gap-1 items-center justify-center"
            >
              <button
                onClick={previous}
                className="text-3xl text-white bg-zinc-800 cursor-pointer rounded-full"
              >
                <i className="ri-skip-back-mini-fill"></i>
              </button>
              <audio
                ref={audioRef}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                className="w-[80%]"
                controls
                autoPlay
                onEnded={next}
                src={e?.downloadUrl?.[4]?.url}
              ></audio>
              <button
                onClick={next}
                className="text-3xl text-white bg-zinc-800 cursor-pointer rounded-full"
              >
                <i className="ri-skip-right-fill"></i>
              </button>
            </motion.div>

            {/* Queue Button + Download Options */}
            <div className="flex items-center gap-4">
              {/* Queue Button */}
              <button
                onClick={() => setShowQueue(!showQueue)}
                className={`flex flex-col items-center gap-1 p-2 rounded-md duration-300 cursor-pointer ${
                  showQueue
                    ? "bg-green-500/20 text-green-400"
                    : "hover:bg-slate-600 text-zinc-400 hover:text-white"
                }`}
                title="Song Queue"
              >
                <i className="ri-play-list-2-line text-2xl"></i>
                <span className="text-[10px] font-semibold">
                  Queue ({songsList.length})
                </span>
              </button>

              {/* Download Options */}
              <div className="flex flex-col text-[1vw] items-center gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-400">
                    Download Options
                  </h3>
                </div>
                <div className="flex flex-row-reverse gap-2">
                  <p
                    onClick={() =>
                      handleGenerateAudio2({
                        audioUrl: e?.downloadUrl?.[4]?.url,
                        imageUrl: e?.image?.[2]?.url,
                        songName: e?.name,
                        year: e?.year,
                        album: e?.album?.name,
                        artist: e?.artists?.primary
                          ?.map((artist) => artist.name)
                          .join(","),
                      })
                    }
                    className="duration-300 cursor-pointer hover:text-slate-400 hover:bg-slate-600 hover:scale-90 w-fit p-1 sm:text-sm font-semibold rounded-md shadow-2xl bg-slate-400 flex flex-col items-center"
                  >
                    Highest quality with <br />
                    <p className="text-xs text-center">FLAC Format</p>
                  </p>
                  <p
                    onClick={() =>
                      handleGenerateAudio({
                        audioUrl: e?.downloadUrl?.[4]?.url,
                        imageUrl: e?.image?.[2]?.url,
                        songName: e?.name,
                        year: e?.year,
                        album: e?.album?.name,
                        artist: e?.artists?.primary
                          ?.map((artist) => artist.name)
                          .join(","),
                      })
                    }
                    className="duration-300 cursor-pointer hover:text-slate-400 hover:bg-slate-600 hover:scale-90 w-fit p-1 sm:text-sm font-semibold rounded-md shadow-2xl bg-slate-400 flex flex-col items-center"
                  >
                    320kbps <br />
                    <p className="text-xs text-center">
                      High quality with poster embedded
                    </p>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </>
  );
};
export default PlayerBar;
