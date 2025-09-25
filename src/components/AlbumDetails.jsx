import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Loading from "./Loading";
import wavs from "../../public/wavs.gif";
import {
  animate,
  circIn,
  circInOut,
  circOut,
  easeIn,
  easeInOut,
  easeOut,
  motion,
} from "framer-motion";
import { useAnimate, stagger } from "framer-motion";
import { Bounce, Expo, Power4, Sine } from "gsap/all";
import { Circ } from "gsap/all";
import toast, { Toaster } from "react-hot-toast";
import  handleGenerateAudio  from "./../utils/audioUtils";
import  handleGenerateAudio2  from "./../utils/audioUtils2";

const AlbumDetails = () => {
  const navigate = useNavigate();
  let location = useLocation();
  let id = location.pathname;
  let newid = id.split("/");
  let finalid = newid[3];

  const [details, setdetails] = useState([]);
  const [songlink, setsonglink] = useState([]);
  var [index, setindex] = useState("");
  const [like, setlike] = useState(false);
  const [like2, setlike2] = useState(false);
  const [existingData, setexistingData] = useState(null);
  const audioRef = useRef();
  const [audiocheck, setaudiocheck] = useState(true);
  const [isFFmpegLoaded, setisFFmpegLoaded] = useState(false);


  const Getdetails = async () => {
    try {
      const { data } = await axios.get(
        // `https://saavn.dev/api/albums?id=${finalid}`
        // `https://jiosaavan-harsh-patel.vercel.app/albums?id=${finalid}`
        `https://jiosavan-api-with-playlist.vercel.app/api/albums?id=${finalid}`
      );
      setdetails(data.data.songs);
    } catch (error) {
      console.log("error", error);
    }
  };

  function audioseter(i) {
    if (songlink[0]?.id === details[i].id) {
      const audio = audioRef.current;
      if (!audio.paused) {
        audio.pause();
        setaudiocheck(false);
      } else {
        setaudiocheck(true);
        audio.play().catch((error) => {
          console.error("Playback failed:", error);
        });
      }
    } else {
      setindex(i);
      setsonglink([details[i]]);
    }
  }

  function likeset(e) {
    // console.log(e);
    var tf =
      localStorage.getItem("likeData") &&
      JSON.parse(localStorage.getItem("likeData")).some(
        (item) => item.id == e?.id
      );
    // console.log(tf);
    // console.log(e?.id);
    setlike(tf);
    // console.log(like);
  }

  function likehandle(i) {
    // Retrieve existing data from localStorage
    let existingData = localStorage.getItem("likeData");

    // Initialize an array to hold the updated data
    let updatedData = [];

    // If existing data is found, parse it from JSON
    if (existingData) {
      updatedData = JSON.parse(existingData);
    }

    // Check if the new data already exists in the existing data
    let exists = updatedData.some((item) => item.id === i.id);

    if (!exists) {
      // If not, add the new data
      updatedData.push(i);
      // Store the updated data back into localStorage
      localStorage.setItem("likeData", JSON.stringify(updatedData));
      setlike(true);
      // toast.success(`Song (${i?.name}) added to Likes section. ✅`);
      toast(`Song (${i?.name}) added to Likes section`, {
        icon: "✅",
        duration: 1500,
        style: {
          borderRadius: "10px",
          background: "rgb(115 115 115)",
          color: "#fff",
        },
      });
    } else {
      // setlike(true);
      // Otherwise, inform the user that the song is already liked
      // console.log("You've already liked this song.");
      // toast.error("You've already liked this song.");

      setlike(false);
      let existingData = localStorage.getItem("likeData");

      // If no data exists, there's nothing to remove
      if (!existingData) {
        console.log("No data found in localStorage.");
        return;
      }
      // Parse the existing data from JSON
      let updatedData = JSON.parse(existingData);

      // Find the index of the song with the given ID in the existing data
      const indexToRemove = updatedData.findIndex((item) => item.id === i.id);

      // If the song is found, remove it from the array
      if (indexToRemove !== -1) {
        updatedData.splice(indexToRemove, 1);

        // Store the updated data back into localStorage
        localStorage.setItem("likeData", JSON.stringify(updatedData));
        //   console.log("Song removed successfully.");
        // toast.success(`Song (${i?.name}) removed successfully. 🚮`);
        toast(`Song (${i?.name}) removed successfully.`, {
          icon: "⚠️",
          duration: 1500,
          style: {
            borderRadius: "10px",
            background: "rgb(115 115 115)",
            color: "#fff",
          },
        });

        // if (index>0 && details.length>=0) {
        //     setrerender(!rerender)
        //     var index2 = index-1
        //     setindex(index2);
        //     setsonglink([details[index2]]);
        // }
        // else{
        //     setrerender(!rerender)
        // }
      } else {
        toast.error("Song not found in localStorage.");
        //   console.log("Song not found in localStorage.");
      }
    }
  }

  function likehandle2(i) {
    // Retrieve existing data from localStorage
    let existingData = localStorage.getItem("likeData");

    // Initialize an array to hold the updated data
    let updatedData = [];

    // If existing data is found, parse it from JSON
    if (existingData) {
      updatedData = JSON.parse(existingData);
    }

    // Check if the new data already exists in the existing data
    let exists = updatedData.some((item) => item.id === i.id);

    if (!exists) {
      // If not, add the new data
      updatedData.push(i);
      // Store the updated data back into localStorage
      localStorage.setItem("likeData", JSON.stringify(updatedData));
      setlike2(!like2);
      // toast.success(`Song (${i?.name}) added to Likes section. ✅`);
      toast(`Song (${i?.name}) added to Likes section`, {
        icon: "✅",
        duration: 1500,
        style: {
          borderRadius: "10px",
          background: "rgb(115 115 115)",
          color: "#fff",
        },
      });
    } else {
      // setlike(true);
      // Otherwise, inform the user that the song is already liked
      // console.log("You've already liked this song.");
      // toast.error("You've already liked this song.");

      setlike2(!like2);
      let existingData = localStorage.getItem("likeData");

      // If no data exists, there's nothing to remove
      if (!existingData) {
        console.log("No data found in localStorage.");
        return;
      }
      // Parse the existing data from JSON
      let updatedData = JSON.parse(existingData);

      // Find the index of the song with the given ID in the existing data
      const indexToRemove = updatedData.findIndex((item) => item.id === i.id);

      // If the song is found, remove it from the array
      if (indexToRemove !== -1) {
        updatedData.splice(indexToRemove, 1);

        // Store the updated data back into localStorage
        localStorage.setItem("likeData", JSON.stringify(updatedData));
        //   console.log("Song removed successfully.");
        // toast.success(`Song (${i?.name}) removed successfully. 🚮`);
        toast(`Song (${i?.name}) removed successfully.`, {
          icon: "⚠️",
          duration: 1500,
          style: {
            borderRadius: "10px",
            background: "rgb(115 115 115)",
            color: "#fff",
          },
        });

        // if (index>0 && details.length>=0) {
        //     setrerender(!rerender)
        //     var index2 = index-1
        //     setindex(index2);
        //     setsonglink([details[index2]]);
        // }
        // else{
        //     setrerender(!rerender)
        // }
      } else {
        toast.error("Song not found in localStorage.");
        //   console.log("Song not found in localStorage.");
      }
    }
  }



// const initializeMediaSession = () => {
  
//     if ("mediaSession" in navigator) {
//       navigator.mediaSession.metadata = new MediaMetadata({
//         title: songlink[0]?.name || "",
//         artist: songlink[0]?.album?.name || "",
//         artwork: [
//           {
//             src: songlink[0]?.image[2]?.url || "",
//             sizes: "512x512",
//             type: "image/jpeg",
//           },
//         ],
//       });
  
//       navigator.mediaSession.setActionHandler("play", function () {
//         // Handle play action
//         if (audioRef.current) {
//           audioRef.current.play().catch((error) => {
//             console.error("Play error:", error);
//           });
//         }
//       });
  
//       navigator.mediaSession.setActionHandler("pause", function () {
//         // Handle pause action
//         if (audioRef.current) {
//           audioRef.current.pause().catch((error) => {
//             console.error("Pause error:", error);
//           });
//         }
//       });
  
//       navigator.mediaSession.setActionHandler("previoustrack", function () {
//         pre();
//       });
  
//       navigator.mediaSession.setActionHandler("nexttrack", function () {
//         next();
//       });
//     } else {
//       console.warn("MediaSession API is not supported or the device is iOS.");
//     }
//   };

const initializeMediaSession = () => {
  if ("mediaSession" in navigator) {
    // --- Metadata set karna ---
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

    // --- Position state set karna ---
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

    // Initial metadata update
    updateMetadata();

    // --- Play action ---
    navigator.mediaSession.setActionHandler("play", () => {
      if (audioRef.current) {
        audioRef.current.play().catch((error) => {
          console.error("Play error:", error);
        });
        updateMetadata();
        updatePositionState();
      }
    });

    // --- Pause action ---
    navigator.mediaSession.setActionHandler("pause", () => {
      if (audioRef.current) {
        audioRef.current.pause();
        updateMetadata(); // pause ke time bhi metadata refresh
        updatePositionState(); // position state bhi update
      }
    });

    // --- Previous track ---
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      pre();
      updateMetadata();
      updatePositionState();
    });

    // --- Next track ---
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      next();
      updateMetadata();
      updatePositionState();
    });

    // Audio events ke saath sync
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
  } else {
    console.warn("MediaSession API is not supported on this device.");
  }
};







  function next() {
    if (index < details.length - 1) {
      setindex(index++);
      audioseter(index);
    } else {
      setindex(0);
      setsonglink([details[0]]);
    }
  }
  function pre() {
    if (index > 0) {
      setindex(index--);
      audioseter(index);
    } else {
      setindex(details.length - 1);
      setsonglink([details[details.length - 1]]);
    }
  }

  // const handleDownloadSong = async (url, name) => {
  //   try {
  //     toast.success(`Song ${name} Downloading...`);
  //     const res = await fetch(url);
  //     const blob = await res.blob();
  //     const link = document.createElement("a");
  //     link.href = URL.createObjectURL(blob);
  //     link.download = `${name}.mp3`;

  //     document.body.appendChild(link);
  //     link.click();

  //     document.body.removeChild(link);
  //     toast.success("Song Downloaded ✅");
  //   } catch (error) {
  //     console.log("Error fetching or downloading files", error);
  //   }
  // };

  const handleDownloadSong = (url, name, poster) => {
    return toast.promise(
      new Promise(async (resolve, reject) => {
        try {
          // Display loading message
          // toast.loading(`Song ${name} Downloading...`, {
          //   id: 'loading-toast' // Set a unique ID for the loading toast
          // });
  
          // Perform the download
          const res = await fetch(url);
          const blob = await res.blob();
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `${name}.mp3`;
  
          document.body.appendChild(link);
          link.click();
  
          document.body.removeChild(link);
  
          resolve(); // Resolve the promise once the download is complete
        } catch (error) {
          console.log("Error fetching or downloading files", error);
          reject("Error downloading song");
        }
      }),
      {
        loading: `Song ${name} Downloading...`, // Loading message
        success: `Song Downloaded ✅`, // Success message
        error: <b>Error downloading song.</b> // Error message
      }
    );
  };

  // const handleGenerateAudio = async (data) => {
  //   try {
  //     toast.loading(`Processing your audio (${data.songName}) Please wait...`);

  //     const response = await axios.get("https://the-ultimate-songs-download-server-python.vercel.app/generate-audio", {
  //       params: data,
  //       responseType: "blob", // Important to receive the file as a blob
  //     });

  //     if (response.status === 200) {
  //       // Create a link to download the file
  //       const blob = new Blob([response.data], { type: "audio/mp3" });
  //       const downloadLink = document.createElement("a");
  //       downloadLink.href = URL.createObjectURL(blob);
  //       downloadLink.download = `${data.songName || "your_audio"}.m4a`;
  //       document.body.appendChild(downloadLink);
  //       downloadLink.click();
  //       document.body.removeChild(downloadLink);

  //       toast.dismiss(); // Dismiss the loading toast
  //       toast.success(`Your audio file (${data.songName}) is ready and downloaded!`);
  //     } else {
  //       throw new Error("Failed to generate the audio.");
  //     }
  //   } catch (error) {
  //     toast.dismiss(); // Dismiss the loading toast
  //     toast.error(
  //       "An error occurred. Please check the audio or image URLs and try again."
  //     );
  //     console.error("Error generating audio:", error);
  //   }
  // };

  // let isFFmpegLoaded = false;
  
  // const handleGenerateAudio = async ({
  //   audioUrl,
  //   imageUrl,
  //   songName,
  //   year,
  //   album,
  //   artist,
  // }) => {
  //   const ffmpeg = new FFmpeg({
  //     log: true,
  //   });
  
  //   // Add toast notification for the promise
  //   toast.promise(
  //     (async () => {
  //       try {
  //         // Load FFmpeg only once
  //         if (!isFFmpegLoaded) {
  //           console.log("Loading FFmpeg")
  //           const coreURL = "/ffmpeg/ffmpeg-core.js";
  //           const wasmURL = "/ffmpeg/ffmpeg-core.wasm";
  
  //           await ffmpeg.load({
  //             coreURL: await toBlobURL(coreURL, "text/javascript"),
  //             wasmURL: await toBlobURL(wasmURL, "application/wasm"),
  //           });
  //           setisFFmpegLoaded(true)
  //           console.log(isFFmpegLoaded)
  //         }
  //         console.log(ffmpeg)
  
  //         // Fetch the audio and image files
  //         const audioBuffer = await fetchFile(audioUrl);
  //         const imageBuffer = await fetchFile(imageUrl);
  
  //         // Write files to FFmpeg's virtual file system
  //         await ffmpeg.writeFile("input.mp3", audioBuffer);
  //         await ffmpeg.writeFile("cover.jpg", imageBuffer);
  
  //         // Execute FFmpeg command to embed metadata and re-encode the audio
  //         await ffmpeg.exec([
  //           "-i", "input.mp3", 
  //           "-i", "cover.jpg", 
  //           "-map", "0:0", 
  //           "-map", "1:0", 
  //           "-metadata", `title=${songName}`, 
  //           "-metadata", `artist=${artist}`, 
  //           "-metadata", `album=${album}`, 
  //           "-metadata", `date=${year}`, 
  //           "-id3v2_version", "3", 
  //           "-c:a", "libmp3lame", 
  //           "-b:a", "320k",  // Set bitrate to 320kbps
  //           "output.mp3"
  //         ]);
  
  //         // Read the output file
  //         const output = await ffmpeg.readFile("output.mp3");
  
  //         if (!output || output.byteLength === 0) {
  //           throw new Error("FFmpeg failed to generate a valid output file.");
  //         }
  
  //         // Create a downloadable blob
  //         const blob = new Blob([output.buffer], { type: "audio/mpeg" });
  //         const url = URL.createObjectURL(blob);
  
  //         // Trigger file download
  //         const link = document.createElement("a");
  //         link.href = url;
  //         link.download = `${songName}.mp3`;
  //         document.body.appendChild(link);
  //         link.click();
  //         link.remove();
  //       } catch (error) {
  //         throw error;  // Throw the error to be caught by toast.promise()
  //       }
  //     })(),
  //     {
  //       loading: `Generating audio file...(${songName})`,
  //       success: `(${songName}) has been generated successfully!`,
  //       error: 'Error generating audio file.',
  //     }
  //   );
  // };

  function seccall() {
    const intervalId = setInterval(() => {
      if (details.length === 0) {
        Getdetails();
      }
    }, 3000);
    return intervalId;
  }

  useEffect(() => {
    var interval = seccall();

    return () => clearInterval(interval);
  }, [details, like, songlink, like2, existingData]);

  useEffect(() => {
    likeset(songlink[0]);
  }, [details, like, songlink, like2, existingData]);

  useEffect(() => {
    // Retrieve all data from localStorage
    const allData = localStorage.getItem("likeData");

    // Check if data exists in localStorage
    if (allData) {
      // Parse the JSON string to convert it into a JavaScript object
      const parsedData = JSON.parse(allData);

      // Now you can use the parsedData object
      setexistingData(parsedData);
    } else {
      console.log("No data found in localStorage.");
    }
  }, [details, like, songlink, like2]);


  useEffect(() => {
  if (songlink.length > 0 && audioRef.current) {
    audioRef.current.play().catch((err) => console.warn("Autoplay error:", err));
    initializeMediaSession();
  }

  // --- Visibility change listener ---
  const handleVisibilityChange = () => {
    if (!document.hidden) { // Screen on / tab visible
      initializeMediaSession();
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}, [songlink]);



//   useEffect(() => {
//   if (songlink.length > 0 && audioRef.current) {
//     audioRef.current.play().catch((err) => console.warn("Autoplay error:", err));
//     initializeMediaSession();
//   }
// }, [songlink]);


  // useEffect(() => {
  //   if (songlink.length > 0) {
  //     audioRef.current.play();
  //     initializeMediaSession();
  //   }
  // }, [songlink]);

  // useEffect(() => {
  //   Getdetails();
  // }, []);

  var title = songlink[0]?.name;

  document.title = `${title ? title : "THE ULTIMATE SONGS"}`;
  // console.log(finalid);
  // console.log(details);
  // console.log(songscount);
  // console.log();
  // console.log(index);
  // console.log(like);
  // console.log(existingData);
  return details.length ? (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7 }}
      className=" w-full h-screen  bg-slate-700"
    >
      <Toaster position="top-center" reverseOrder={false} />
      <div className="w-full fixed z-[99] backdrop-blur-xl flex items-center gap-3 sm:h-[7vh]  h-[10vh]">
        <i
          onClick={() => navigate(-1)}
          className="text-3xl cursor-pointer ml-5 bg-green-500 rounded-full ri-arrow-left-line"
        ></i>
        <h1 className="text-xl text-zinc-300 font-black">THE ULTIMATE SONGS</h1>
      </div>

      {/* <div className="w-full relative text-white p-10 sm:p-3 sm:gap-3 h-[65vh] overflow-y-auto flex sm:block flex-wrap gap-7 justify-center ">
        {details?.map((d, i) => (
          <Link
            key={i}
            onClick={() => audioseter(i)}
            className="relative hover:scale-90 sm:hover:scale-100 duration-150  w-[15vw] sm:mb-3 sm:w-full sm:flex sm:items-center sm:gap-3  rounded-md h-[20vw] sm:h-[15vh]  "
          >
            <motion.img
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="w-full h-[15vw] sm:h-[15vh] sm:w-[15vh] rounded-md"
              src={d.image[2].url}
              alt=""
            />
            <img
              className={`absolute top-0 w-[20%] sm:w-[10%] rounded-md ${
                i === index ? "block" : "hidden"
              } `}
              src={wavs}
              alt=""
            />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col mt-2"
            >
              <h3
                className={`text-sm sm:text-xs leading-none  font-bold ${
                  i === index && "text-green-300"
                }`}
              >
                {d.name}
              </h3>
              <h4 className="text-xs sm:text-[2.5vw] text-zinc-300 ">
                {d.album.name}
              </h4>
            </motion.div>
          </Link>
        ))}
        <div className="flex gap-3 text-2xl  ">
            <h1>MADE BY ❤️ HARSH PATEL</h1>
            <a
              target="_blank"
              href="https://www.instagram.com/harsh_patel_80874/"
            >
              <i className=" ri-instagram-fill"></i>
            </a>
          </div>
      </div> */}

      <div className="flex w-full bg-slate-700 pt-[15vh] sm:pt-[10vh] pb-[25vh] sm:pb-[35vh] text-white p-10 sm:p-3 sm:gap-3 min-h-[65vh] overflow-y-auto  sm:block flex-wrap gap-5 justify-center ">
        {details?.map((d, i) => (
          <div
            title="click on song image or name to play the song"
            key={i}
            className="items-center justify-center relative hover:scale-95 sm:hover:scale-100 duration-150 w-[40%] flex mb-3 sm:mb-3 sm:w-full sm:flex sm:items-center sm:gap-3  rounded-md h-[10vw] sm:h-[15vh] cursor-pointer bg-slate-600  "
          >
            <div
              onClick={() => audioseter(i)}
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
                className={`absolute top-0 w-[8%] sm:w-[10%] rounded-md ${
                  d.id === songlink[0]?.id ? "block" : "hidden"
                } `}
                src={wavs}
                alt=""
              />
               {songlink.length>0 && <i className={`absolute top-0 sm:h-[15vh] w-[10vw] h-full flex items-center justify-center text-5xl sm:w-[15vh]  opacity-90  duration-300 rounded-md ${
                      d.id === songlink[0]?.id ? "block" : "hidden"
                    } ${audiocheck ? "ri-pause-circle-fill" :"ri-play-circle-fill" }`}></i>}
              <div className="ml-3 sm:ml-3 flex justify-center items-center gap-5 mt-2">
                <div className="flex flex-col">
                  <h3
                    className={`text-sm sm:text-xs leading-none  font-bold ${
                      d.id === songlink[0]?.id && "text-green-300"
                    }`}
                  >
                    {d.name}
                  </h3>
                  <h4 className="text-xs sm:text-[2.5vw] text-zinc-300 ">
                    {d.album.name}
                  </h4>
                </div>
              </div>
            </div>

            {existingData?.find((element) => element?.id == d?.id) ? (
              <i
                onClick={() => likehandle2(d)}
                className={`text-xl m-auto flex w-[3vw] sm:w-[9vw] rounded-full justify-center items-center h-[3vw] sm:h-[9vw]    duration-300 cursor-pointer text-red-500  ri-heart-3-fill`}
              ></i>
            ) : (
              <i
                onClick={() => likehandle2(d)}
                className={`text-xl m-auto flex w-[3vw] sm:w-[9vw] rounded-full justify-center items-center h-[3vw] sm:h-[9vw]   duration-300 cursor-pointer text-zinc-300  ri-heart-3-fill`}
              ></i>
            )}

            {/* <i
                onClick={() => likehandle(d)}
                className={`text-xl m-auto flex w-[3vw] sm:w-[9vw] rounded-full justify-center items-center h-[3vw] sm:h-[9vw]  bg-red-500   text-zinc-300 hover:scale-150 sm:hover:scale-100 duration-300 cursor-pointer ${
                  like ? "text-red-500" : "text-zinc-300"
                }  ri-heart-3-fill`}
              ></i> */}

            {/* <i
              title="Remove Song "
              onClick={() => removehandle(d.id)}
              className="m-auto flex w-[3vw] sm:w-[9vw] rounded-full justify-center items-center h-[3vw] sm:h-[9vw] text-xl bg-red-500  duration-300 cursor-pointer text-zinc-300 ri-dislike-fill"
            ></i> */}
          </div>
        ))}

        {/* <div className="flex gap-3 text-2xl  ">
          <h1>MADE BY ❤️ HARSH PATEL</h1>
          <a
            target="_blank"
            href="https://www.instagram.com/harsh_patel_80874/"
          >
            <i className=" ri-instagram-fill"></i>
          </a>
        </div> */}
      </div>

      <motion.div
        className={
          songlink.length > 0
            ? ` duration-700 flex fixed z-[99] bottom-0     gap-3 items-center  w-full py-3  backdrop-blur-xl  `
            : "block"
        }
      >
        {songlink?.map((e, i) => (
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            key={i}
            className="flex sm:block w-full sm:w-full sm:h-full items-center justify-center gap-3"
          >
            <motion.div
              initial={{ x: -50, opacity: 0, scale: 0 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              className="w-[25vw] sm:w-full  flex gap-3 items-center sm:justify-center rounded-md  h-[7vw] sm:h-[30vw]"
            >
              <p className=" text-green-400">{index+1}</p>
              <motion.img
                initial={{ x: -50, opacity: 0, scale: 0 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                className="rounded-md h-[7vw] sm:h-[25vw]"
                src={e?.image[2]?.url}
                alt=""
              />
              <h3 className=" sm:w-[30%] text-white text-xs font-semibold">
                {e?.name}
              </h3>
              {/* <i
                onClick={() =>
                  handleDownloadSong(e?.downloadUrl[4].url, e.name)
                }
                className="hidden sm:flex cursor-pointer  items-center justify-center bg-green-700 sm:w-[9vw] sm:h-[9vw] w-[3vw] h-[3vw]   rounded-full text-2xl ri-download-line"
              ></i> */}

              <i
                onClick={() => likehandle(e)}
                className={`text-xl hover:scale-150 sm:hover:scale-100 duration-300 cursor-pointer ${
                  like ? "text-red-500" : "text-zinc-300"
                }  ri-heart-3-fill`}
              ></i>
              {/* <i
                onClick={() => navigate(`/songs/details/${e.id}`)}
                className="text-zinc-300 text-xl hover:scale-150 sm:hover:scale-100 duration-300 cursor-pointer ri-information-fill"
              ></i> */}

              {/* {localStorage.getItem("likeData") &&
              JSON.parse(localStorage.getItem("likeData")).some(
                (item) => item.id === e.id
              ) ? (
                <i
                  onClick={() => likehandle(e)}
                  className={`text-xl cursor-pointer text-red-500 ri-heart-3-fill`}
                ></i>
              ) : (
                <i
                  onClick={() => likehandle(e)}
                  className={`text-xl cursor-pointer text-zinc-300 ri-heart-3-fill`}
                ></i>
              )} */}

              {/* {like ? (
                <i
                  onClick={() => likehandle(e)}
                  className="text-xl cursor-pointer text-red-500 ri-heart-3-fill"
                ></i>
              ) : (
                <i
                  onClick={() => likehandle(e)}
                  className="text-xl cursor-pointer text-zinc-300  ri-heart-3-fill"
                ></i>
              )} */}
            </motion.div>
            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              className="w-[35%]  sm:w-full h-[10vh] flex gap-3 sm:gap-1 items-center justify-center"
            >
              <i
                onClick={() => pre()}
                className="text-3xl text-white bg-zinc-800 cursor-pointer rounded-full ri-skip-back-mini-fill"
              ></i>
              <audio
                className="w-[80%] "
                ref={audioRef}
                onPause={()=>setaudiocheck(false)}
                onPlay={()=>setaudiocheck(true)}
                controls
                autoPlay
                onEnded={() => next()}
                src={e?.downloadUrl[4]?.url}
              ></audio>
              <i
                onClick={() => next()}
                className=" text-3xl text-white bg-zinc-800 cursor-pointer rounded-full ri-skip-right-fill"
              ></i>
            </motion.div>
            <div className=" flex flex-col text-[1vw] items-center  gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-400">
                  Download Options
                </h3>
              </div>
              <div className="flex flex-row-reverse gap-2 ">
                {/* <p
                  onClick={() =>
                    handleDownloadSong(e.downloadUrl[0].url, e.name + " 12kbps")
                  }
                  className="duration-300 cursor-pointer hover:text-slate-400 hover:bg-slate-600 hover:scale-90 w-fit p-1 font-semibold rounded-md shadow-2xl bg-slate-400 flex flex-col items-center"
                >
                  12kbps <br />
                  <p className="text-xs">Very low quality</p>
                </p>
                <p
                  onClick={() =>
                    handleDownloadSong(e.downloadUrl[1].url, e.name + " 48kbps")
                  }
                  className="duration-300 cursor-pointer  hover:text-slate-400 hover:bg-slate-600 hover:scale-90 w-fit p-1 font-semibold rounded-md shadow-2xl bg-slate-400 flex flex-col items-center"
                >
                  48kbps <br />
                  <p className="text-xs">Low quality</p>
                </p>
                <p
                  onClick={() =>
                    handleDownloadSong(e.downloadUrl[2].url, e.name + " 96kbps")
                  }
                  className="duration-300 cursor-pointer  hover:text-slate-400 hover:bg-slate-600 hover:scale-90 w-fit p-1 font-semibold rounded-md shadow-2xl bg-slate-400 flex flex-col items-center"
                >
                  96kbps <br />
                  <p className="text-xs">Fair quality</p>
                </p>
                <p
                  onClick={() =>
                    handleDownloadSong(
                      e.downloadUrl[3].url,
                      e.name + " 160kbps"
                    )
                  }
                  className="duration-300 cursor-pointer  hover:text-slate-400 hover:bg-slate-600 hover:scale-90 w-fit p-1 font-semibold rounded-md shadow-2xl bg-slate-400 flex flex-col items-center"
                >
                  160kbps <br />
                  <p className="text-xs">Good quality</p>
                </p>
                <p
                  onClick={() =>
                    handleDownloadSong(
                      e.downloadUrl[4].url,
                      e.name + " 320kbps"
                    )
                  }
                  className="duration-300 cursor-pointer  hover:text-slate-400 hover:bg-slate-600 hover:scale-90 w-fit p-1 font-semibold rounded-md shadow-2xl bg-slate-400 flex flex-col items-center"
                >
                  320kbps <br />
                  <p className="text-xs"> High quality</p>
                </p> */}
                 <p
                  // onClick={() =>
                  //   handleDownloadSong(
                  //     e.downloadUrl[4].url,
                  //     e.name + " 320kbps",
                  //     e?.image[2]?.url
                  //   )
                  // }
                  // onClick={() => window.open(`https://mp3-download-server-production.up.railway.app/generate-audio?audioUrl=${e.downloadUrl[4].url}&imageUrl=${e?.image[2]?.url}&songName=${e.name + " 320kbps"}&year=${e.year}&album=${e.album.name}`, "_blank")}

                  onClick={() =>
                    handleGenerateAudio2({
                      audioUrl:  e?.downloadUrl[4].url,
                      imageUrl: e?.image[2]?.url,
                      songName:  e?.name,
                      year: e?.year,
                      album: e?.album.name,
                      artist:e?.artists.primary.map(artist => artist.name).join(",")
                    })
                  }

                  className="duration-300 cursor-pointer  hover:text-slate-400 hover:bg-slate-600 hover:scale-90 w-fit p-1 sm:text-sm font-semibold rounded-md shadow-2xl bg-slate-400 flex flex-col items-center"
                >
                  Highest quality with <br />
                  <p className="text-xs text-center">
                    {" "}
                    FLAC Format
                  </p>
                </p>
                <p
                  // onClick={() =>
                  //   handleDownloadSong(
                  //     e.downloadUrl[4].url,
                  //     e.name + " 320kbps",
                  //     e?.image[2]?.url
                  //   )
                  // }
                  // onClick={() => window.open(`https://the-ultimate-songs-download-server.up.railway.app/generate-audio?audioUrl=${e.downloadUrl[4].url}&imageUrl=${e?.image[2]?.url}&songName=${e.name + " 320kbps"}&year=${e.year}&album=${e.album.name}`, "_blank")}

                  onClick={() =>
                    handleGenerateAudio({
                      audioUrl:  e?.downloadUrl[4].url,
                      imageUrl: e?.image[2]?.url,
                      songName:  e?.name,
                      year: e?.year,
                      album: e?.album.name,
                      artist:e?.artists.primary.map(artist => artist.name).join(",")
                    })
                  }


                  className="duration-300 cursor-pointer  hover:text-slate-400 hover:bg-slate-600 hover:scale-90 w-fit p-1 sm:text-sm font-semibold rounded-md shadow-2xl bg-slate-400 flex flex-col items-center"
                >
                  320kbps <br />
                  <p className="text-xs text-center">High quality with poster embedded</p>
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  ) : (
    <Loading />
  );
};

export default AlbumDetails;
