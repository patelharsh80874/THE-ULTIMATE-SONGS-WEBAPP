import toast from "react-hot-toast";
import JSZip from "jszip";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

// Create a fresh FFmpeg instance
const createFFmpegInstance = async () => {
  const ffmpeg = new FFmpeg({ log: false });
  const coreURL = "/ffmpeg/ffmpeg-core.js";
  const wasmURL = "/ffmpeg/ffmpeg-core.wasm";

  await ffmpeg.load({
    coreURL: await toBlobURL(coreURL, "text/javascript"),
    wasmURL: await toBlobURL(wasmURL, "application/wasm"),
  });

  return ffmpeg;
};

const downloadSongsWithMetadataAsZip = (songs,setdownload) => {
  if (songs.length > 0) {
    setdownload(true)
    return toast.promise(
      new Promise(async (resolve, reject) => {
        let ffmpeg = null;
        try {
          const zip = new JSZip();
          ffmpeg = await createFFmpegInstance();

          for (const song of songs) {
            const { title, url, image, album, artist, year } = song;
            try {
              // Fetch audio + cover
              const [audioBuffer, imageBuffer] = await Promise.all([
                fetchFile(url),
                fetchFile(image),
              ]);

              // Write files to FFmpeg FS
              await ffmpeg.writeFile("input.mp3", audioBuffer);
              await ffmpeg.writeFile("cover.jpg", imageBuffer);

              // Run ffmpeg for metadata
              await ffmpeg.exec([
                "-i", "input.mp3",
                "-i", "cover.jpg",
                "-map", "0:0",
                "-map", "1:0",
                "-metadata", `title=${title}`,
                "-metadata", `artist=${artist}`,
                "-metadata", `album=${album}`,
                "-metadata", `date=${year}`,
                "-id3v2_version", "3",
                "-c:a", "libmp3lame",
                "-b:a", "320k",
                "output.mp3",
              ]);

              const output = await ffmpeg.readFile("output.mp3");
              if (!output || output.byteLength === 0) {
                throw new Error(`FFmpeg failed for ${title}`);
              }

              const blob = new Blob([output.buffer], { type: "audio/mpeg" });
              zip.file(`${title}.mp3`, blob, { binary: true });

              // Clean temp files (optional)
              await ffmpeg.deleteFile("input.mp3");
              await ffmpeg.deleteFile("cover.jpg");
              await ffmpeg.deleteFile("output.mp3");
            } catch (error) {
              toast.error(`Error processing ${title}: ${error}`);
            }
          }

          // Generate ZIP
          const content = await zip.generateAsync({ type: "blob" });
          const zipUrl = window.URL.createObjectURL(content);
          const link = document.createElement("a");
          link.href = zipUrl;
          link.download = `songs ${songs.length}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          resolve();
        } catch (error) {
          reject("Error creating songs ZIP");
        } finally {
          if (ffmpeg) ffmpeg.terminate();
          setdownload(false)
        }
      }),
      {
        loading: `Embedding metadata & Downloading and zipping songs...`,
        success: "All songs downloaded with metadata ✅",
        error: "Error downloading songs with metadata ❌",
      }
    );
  } else {
    return toast.error("No songs available to download");
  }
};

export default downloadSongsWithMetadataAsZip;
