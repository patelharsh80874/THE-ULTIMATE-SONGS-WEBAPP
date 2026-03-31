import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { usePlayer } from "../context/PlayerContext";
import wavs from "../../public/wavs.gif";
import AddToPlaylistModal from "./AddToPlaylistModal";
import Tooltip from "./Tooltip";

const Queue = ({ onClose }) => {
  const navigate = useNavigate();
  const {
    songsList,
    currentIndex,
    songlink,
    isPlaying,
    playFromQueue,
    removeFromQueue,
    reorderQueue,
    clearQueue,
  } = usePlayer();

  // Drag state
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [playlistModalSong, setPlaylistModalSong] = useState(null);
  const dragItem = useRef(null);

  const handleDragStart = (e, index) => {
    dragItem.current = index;
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Make drag image slightly transparent
    e.dataTransfer.setData("text/plain", index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverIndex !== null && dragItem.current !== dragOverIndex) {
      reorderQueue(dragItem.current, dragOverIndex);
    }
    dragItem.current = null;
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-0 left-0 right-0 z-[100] bg-slate-800 border-t border-slate-600 rounded-t-2xl shadow-2xl overflow-x-hidden"
      style={{ maxHeight: "70vh" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <i className="ri-play-list-2-line text-xl text-green-400"></i>
          <h2 className="text-lg font-bold text-white">
            Queue{" "}
            <span className="text-sm font-normal text-zinc-400">
              ({songsList.length} songs)
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-zinc-500 sm:hidden">
            <i className="ri-drag-move-line mr-1"></i>Drag to reorder
          </p>
          <Tooltip text="Clear queue">
            <button
              onClick={clearQueue}
              className="px-3 py-1 text-xs font-semibold rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/40 duration-200"
            >
              Clear
            </button>
          </Tooltip>
          <Tooltip text="Close">
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700 text-zinc-400 hover:text-white duration-200"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Song List */}
      <div
        className="overflow-y-auto overflow-x-hidden px-3 py-2"
        style={{ maxHeight: "calc(70vh - 60px)" }}
        onDragLeave={handleDragLeave}
      >
        {songsList.map((song, i) => {
          const isCurrent = i === currentIndex;
          const isDragging = dragIndex === i;
          const isDragOver = dragOverIndex === i;

          return (
            <div
              key={song.id + "-" + i}
              onDragOver={(e) => handleDragOver(e, i)}
              className={`flex items-center gap-3 sm:gap-2 p-2 rounded-lg mb-1 duration-200 group select-none ${
                isDragging
                  ? "opacity-40 scale-95"
                  : isDragOver
                  ? "border-t-2 border-green-400"
                  : isCurrent
                  ? "bg-green-500/10 border border-green-500/20"
                  : "hover:bg-slate-700/50 border border-transparent"
              }`}
            >
              {/* Drag Handle - only this is draggable */}
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragEnd={handleDragEnd}
                className="flex-shrink-0 text-zinc-600 hover:text-zinc-300 cursor-grab active:cursor-grabbing"
              >
                <i className="ri-draggable text-lg"></i>
              </div>

              {/* Index / Now Playing */}
              <div className="w-6 text-center flex-shrink-0">
                {isCurrent ? (
                  <img className="w-5 h-5 mx-auto" src={wavs} alt="" />
                ) : (
                  <span className="text-xs text-zinc-500">{i + 1}</span>
                )}
              </div>

              {/* Song Image */}
              <img
                onClick={() => playFromQueue(i)}
                className="w-10 h-10 rounded-md object-cover cursor-pointer flex-shrink-0"
                src={song.image?.[1]?.url || song.image?.[2]?.url}
                alt=""
              />

              {/* Song Info */}
              <div
                // onClick={() => {
                //   navigate(`/songs/details/${song.id}`);
                //   onClose();
                // }}
                className="flex-1 min-w-0 cursor-pointer"
              >
                <h3
                  className={`text-sm font-semibold truncate ${
                    isCurrent ? "text-green-400" : "text-white"
                  }`}
                >
                  {song.name}
                </h3>
                <p className="text-xs text-zinc-400 truncate">
                  {song.album?.name}
                </p>
              </div>

              {/* Add to Playlist Button */}
              <Tooltip text="Add to Playlist">
                <button
                  onClick={(e) => { e.stopPropagation(); setPlaylistModalSong(song); }}
                  className="w-7 h-7 flex items-center justify-center rounded text-zinc-500 sm:opacity-100 opacity-0 group-hover:opacity-100 hover:text-purple-400 hover:bg-purple-500/10 duration-200 flex-shrink-0"
                >
                  <i className="ri-folder-add-line"></i>
                </button>
              </Tooltip>

              {/* Remove Button — always visible on mobile, hover on desktop */}
              {songsList.length > 1 && (
                <Tooltip text="Remove from Queue">
                  <button
                    onClick={() => removeFromQueue(i)}
                    className="w-7 h-7 flex items-center justify-center rounded text-zinc-500 sm:opacity-100 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 duration-200 flex-shrink-0"
                  >
                    <i className="ri-close-line"></i>
                  </button>
                </Tooltip>
              )}

              {/* Playing indicator */}
              {isCurrent && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-semibold flex-shrink-0">
                  {isPlaying ? "Playing" : "Paused"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Add To Playlist Modal */}
      {playlistModalSong && (
        <AddToPlaylistModal
          song={playlistModalSong}
          onClose={() => setPlaylistModalSong(null)}
        />
      )}
    </motion.div>
  );
};

export default Queue;
