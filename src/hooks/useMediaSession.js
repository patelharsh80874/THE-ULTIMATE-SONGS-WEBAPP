import { useEffect, useCallback } from "react";

/**
 * Custom hook for MediaSession API integration.
 * Replaces the identical 80-line initializeMediaSession function
 * duplicated in Home, Songs, Likes, AlbumDetails, PlaylistDetails, ArtistsDetails.
 */
const useMediaSession = (songlink, audioRef, next, previous) => {
  const initializeMediaSession = useCallback(() => {
    if (!("mediaSession" in navigator)) {
      console.warn("MediaSession API is not supported on this device.");
      return;
    }

    const updateMetadata = () => {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: songlink[0]?.name || "",
        artist: songlink[0]?.album?.name || "",
        artwork: [
          {
            src: songlink[0]?.image[2]?.url || "",
            sizes: "512x512",
            type: "image/jpeg",
          },
        ],
      });
    };

    const updatePositionState = () => {
      if ("setPositionState" in navigator.mediaSession && audioRef.current) {
        try {
          navigator.mediaSession.setPositionState({
            duration: audioRef.current.duration || 0,
            playbackRate: audioRef.current.playbackRate || 1,
            position: audioRef.current.currentTime || 0,
          });
        } catch (err) {
          console.warn("PositionState error:", err);
        }
      }
    };

    updateMetadata();

    navigator.mediaSession.setActionHandler("play", () => {
      if (audioRef.current) {
        audioRef.current.play().catch((error) => {
          console.error("Play error:", error);
        });
        updateMetadata();
        updatePositionState();
      }
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      if (audioRef.current) {
        audioRef.current.pause();
        updateMetadata();
        updatePositionState();
      }
    });

    navigator.mediaSession.setActionHandler("previoustrack", () => {
      previous();
      updateMetadata();
      updatePositionState();
    });

    navigator.mediaSession.setActionHandler("nexttrack", () => {
      next();
      updateMetadata();
      updatePositionState();
    });

    if (audioRef.current) {
      audioRef.current.ontimeupdate = () => updatePositionState();
      audioRef.current.onloadedmetadata = () => {
        updateMetadata();
        updatePositionState();
      };
      audioRef.current.onpause = () => {
        updateMetadata();
        updatePositionState();
      };
    }
  }, [songlink, audioRef, next, previous]);

  // Auto-play and initialize media session when songlink changes
  useEffect(() => {
    if (songlink.length > 0 && audioRef.current) {
      audioRef.current
        .play()
        .catch((err) => console.warn("Autoplay error:", err));
      initializeMediaSession();
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        initializeMediaSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [songlink, initializeMediaSession]);

  return { initializeMediaSession };
};

export default useMediaSession;
