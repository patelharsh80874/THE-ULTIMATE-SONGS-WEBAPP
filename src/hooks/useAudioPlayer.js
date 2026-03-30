import { useState, useRef, useCallback } from "react";

/**
 * Custom hook for audio playback management.
 * Replaces the duplicated audioseter, next, pre, audioRef, audiocheck,
 * songlink, index state management from 6+ components.
 */
const useAudioPlayer = (songsList) => {
  const [songlink, setSonglink] = useState([]);
  const [currentIndex, setCurrentIndex] = useState("");
  const [isPlaying, setIsPlaying] = useState(true);
  const audioRef = useRef();

  // Play or pause a song at the given index
  const playSong = useCallback(
    (i) => {
      if (songlink[0]?.id === songsList[i]?.id) {
        const audio = audioRef.current;
        if (!audio.paused) {
          audio.pause();
          setIsPlaying(false);
        } else {
          setIsPlaying(true);
          audio.play().catch((error) => {
            console.error("Playback failed:", error);
          });
        }
      } else {
        setCurrentIndex(i);
        setSonglink([songsList[i]]);
      }
    },
    [songlink, songsList]
  );

  // Next track
  const next = useCallback(() => {
    if (currentIndex < songsList.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSonglink([songsList[nextIdx]]);
    } else {
      setCurrentIndex(0);
      setSonglink([songsList[0]]);
    }
  }, [currentIndex, songsList]);

  // Previous track
  const previous = useCallback(() => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      setSonglink([songsList[prevIdx]]);
    } else {
      const lastIdx = songsList.length - 1;
      setCurrentIndex(lastIdx);
      setSonglink([songsList[lastIdx]]);
    }
  }, [currentIndex, songsList]);

  // Reset player state
  const resetPlayer = useCallback(() => {
    setSonglink([]);
    setCurrentIndex("");
  }, []);

  return {
    songlink,
    setSonglink,
    currentIndex,
    setCurrentIndex,
    isPlaying,
    setIsPlaying,
    audioRef,
    playSong,
    next,
    previous,
    resetPlayer,
  };
};

export default useAudioPlayer;
