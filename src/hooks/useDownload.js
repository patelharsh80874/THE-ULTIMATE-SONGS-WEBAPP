import { useCallback } from "react";
import toast from "react-hot-toast";

/**
 * Custom hook for song download functionality.
 * Replaces the duplicated handleDownloadSong function from 6 components.
 */
const useDownload = () => {
  const handleDownloadSong = useCallback((url, name) => {
    return toast.promise(
      new Promise(async (resolve, reject) => {
        try {
          const res = await fetch(url);
          const blob = await res.blob();
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `${name}.mp3`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          resolve();
        } catch (error) {
          console.log("Error fetching or downloading files", error);
          reject("Error downloading song");
        }
      }),
      {
        loading: `Song ${name} Downloading...`,
        success: `Song Downloaded ✅`,
        error: `Error downloading song.`,
      }
    );
  }, []);

  return { handleDownloadSong };
};

export default useDownload;
