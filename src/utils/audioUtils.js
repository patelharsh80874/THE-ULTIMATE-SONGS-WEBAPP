import toast from "react-hot-toast";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { toBlobURL } from "@ffmpeg/util";

// Function to create and initialize a new FFmpeg instance
const createFFmpegInstance = async () => {
  const ffmpeg = new FFmpeg({ log: true });
  const coreURL = "/ffmpeg/ffmpeg-core.js";
  const wasmURL = "/ffmpeg/ffmpeg-core.wasm";

  await ffmpeg.load({
    coreURL: await toBlobURL(coreURL, "text/javascript"),
    wasmURL: await toBlobURL(wasmURL, "application/wasm"),
  });

  return ffmpeg;
};

// Main function to generate audio with metadata
const handleGenerateAudio = async ({
  audioUrl,
  imageUrl,
  songName,
  year,
  album,
  artist,
}) => {
  await toast.promise(
    (async () => {
      let ffmpeg = null;
      try {
        // Create a new isolated FFmpeg instance
        ffmpeg = await createFFmpegInstance();

        // Fetch the audio and image files
        const [audioBuffer, imageBuffer] = await Promise.all([
          fetchFile(audioUrl),
          fetchFile(imageUrl),
        ]);

        // Write files to the isolated FFmpeg's virtual file system
        await ffmpeg.writeFile("input.mp3", audioBuffer);
        await ffmpeg.writeFile("cover.jpg", imageBuffer);

        // Execute FFmpeg command
        await ffmpeg.exec([
          "-i", "input.mp3",
          "-i", "cover.jpg",
          "-map", "0:0",
          "-map", "1:0",
          "-metadata", `title=${songName}`,
          "-metadata", `artist=${artist}`,
          "-metadata", `album=${album}`,
          "-metadata", `date=${year}`,
          "-id3v2_version", "3",
          "-c:a", "libmp3lame",
          "-b:a", "320k", // Set bitrate to 320kbps
          "output.mp3",
        ]);

        // Read and download the output file
        const output = await ffmpeg.readFile("output.mp3");
        if (!output || output.byteLength === 0) {
          throw new Error("FFmpeg failed to generate a valid output file.");
        }

        const blob = new Blob([output.buffer], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);

        // Trigger file download
        const link = document.createElement("a");
        link.href = url;
        link.download = `${songName}.mp3`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } finally {
        // Clean up FFmpeg instance to free resources
        if (ffmpeg) ffmpeg.terminate();
      }
    })(),
    {
      loading: `Generating audio file...(${songName})`,
      success: `(${songName}) has been generated successfully!`,
      error: "Error generating audio file.",
    }
  );
};

export default handleGenerateAudio;
