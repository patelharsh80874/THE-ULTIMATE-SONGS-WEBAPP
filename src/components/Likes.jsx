import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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

function Likes() {
  const navigate = useNavigate();
  let location = useLocation();

  const [details, setdetails] = useState([]);
  const [songlink, setsonglink] = useState([]);
  var [index, setindex] = useState("");
  var [rerender, setrerender] = useState(false);
  const [like, setlike] = useState(false);

  function audioseter(i, d) {
    setindex(i);
    setsonglink([details[i]]);
    const isLiked =
      localStorage.getItem("likeData") &&
      JSON.parse(localStorage.getItem("likeData")).some(
        (item) => item.id === d.id
      );
    setlike(isLiked);
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
      toast.success("Song added to Likes section ");
    } else {
      setlike(true);
      // Otherwise, inform the user that the song is already liked
    //   console.log("You've already liked this song.");
      toast.error("You've already liked this song.")
    }
  }

  function removehandle(id) {
    // Retrieve existing data from localStorage
    let existingData = localStorage.getItem("likeData");

    // If no data exists, there's nothing to remove
    if (!existingData) {
      console.log("No data found in localStorage.");
      return;
    }
    // Parse the existing data from JSON
    let updatedData = JSON.parse(existingData);

    // Find the index of the song with the given ID in the existing data
    const indexToRemove = updatedData.findIndex((item) => item.id === id);

    // If the song is found, remove it from the array
    if (indexToRemove !== -1) {
      updatedData.splice(indexToRemove, 1);

      // Store the updated data back into localStorage
      localStorage.setItem("likeData", JSON.stringify(updatedData));
    //   console.log("Song removed successfully.");
      toast.success("Song removed successfully.");
        setrerender(!rerender);
        setsonglink([]);

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
        toast.error("Song not found in localStorage.")
    //   console.log("Song not found in localStorage.");
      setsonglink([]);
     setrerender(!rerender);
    }
  }

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

  const handleDownloadSong = async (url, name, img) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${name}.mp3`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
    } catch (error) {
      console.log("Error fetching or downloading files", error);
    }
  };

  useEffect(() => {
    // Retrieve all data from localStorage
    const allData = localStorage.getItem("likeData");

    // Check if data exists in localStorage
    if (allData) {
      // Parse the JSON string to convert it into a JavaScript object
      const parsedData = JSON.parse(allData);

      // Now you can use the parsedData object
      setdetails(parsedData);
    } else {
      console.log("No data found in localStorage.");
    }
  }, [rerender]);

  var title = songlink[0]?.name;
  document.title = `${title ? title : "THE ULTIMATE SONGS"}`;
//   console.log(details);
//   console.log(rerender);
//   console.log(index);
  return (
    <div className="w-full h-screen bg-slate-700">
        <Toaster position="top-center" reverseOrder={false} />
      <div className="w-full flex items-center gap-3 sm:h-[5vh]  h-[10vh]">
        <i
          onClick={() => navigate(-1)}
          className="text-3xl cursor-pointer ml-5 bg-green-500 rounded-full ri-arrow-left-line"
        ></i>
        <h1 className="text-xl text-zinc-300 font-black">THE ULTIMATE SONGS</h1>
      </div>
      {details.length > 0 ? (
        <div className="w-full text-white p-10 sm:p-3 sm:gap-3 h-[67vh] overflow-y-auto flex sm:block flex-wrap gap-7 justify-center ">
          {details?.map((d, i) => (
            <div
              key={i}
              onClick={() => audioseter(i, d)}
              className="relative hover:scale-90 sm:hover:scale-100 duration-150 w-[15vw] sm:mb-3 sm:w-full sm:flex sm:items-center sm:gap-3  rounded-md h-[20vw] sm:h-[15vh] cursor-pointer  "
            >
              <motion.img
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7 }}
                viewport={{ once: true }}
                className="w-full h-[15vw] sm:h-[15vh] sm:w-[15vh] rounded-md"
                src={d.image[2].url}
                alt=""
              />
              <img
                className={`absolute top-0 w-[20%] sm:w-[10%] rounded-md ${
                  d.id === songlink[0]?.id ? "block" : "hidden"
                } `}
                src={wavs}
                alt=""
              />
              <div className="flex flex-col mt-2">
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
      ) : (
      
         <p>it's empty</p>
       
      )}
     {songlink !== null ?  <motion.div
        className={
          songlink.length > 0
            ? `duration-700 flex  rounded-full sm:rounded-none sm:rounded-t-[30%] gap-3 items-center  w-full min-h-[20vh] sm:min-h-[28vh] bg-slate-600  `
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
              <motion.img
                initial={{ x: -50, opacity: 0, scale: 0 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                className="rounded-md h-[7vw] sm:h-[25vw]"
                src={e.image[2]?.url}
                alt=""
              />
              <h3 className=" sm:w-[30%] text-white text-sm font-semibold">
                {e.name}
              </h3>
              <i
                onClick={() => handleDownloadSong(e.downloadUrl[4].url, e.name)}
                className="hidden sm:flex  cursor-pointer  items-center justify-center bg-green-700 sm:w-[9vw] sm:h-[9vw] w-[3vw] h-[3vw]   rounded-full text-2xl ri-download-line"
              ></i>

              {like ? (
                <i
                  title="You Liked This Song"
                  onClick={() => likehandle(e)}
                  className="text-xl cursor-pointer text-red-500 ri-heart-3-fill"
                ></i>
              ) : (
                <i
                  title="Like Song"
                  onClick={() => likehandle(e)}
                  className="text-xl cursor-pointer text-zinc-300  ri-heart-3-fill"
                ></i>
              )}
              <i
                title="Remove Song "
                onClick={() => removehandle(e.id)}
                className="text-xl cursor-pointer text-zinc-300 ri-dislike-fill"
              ></i>
            </motion.div>
            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              className="w-[35%]  sm:w-full h-[10vh] flex gap-3 sm:gap-1 items-center justify-center"
            >
              <i
                onClick={pre}
                className="text-3xl text-white bg-zinc-800 cursor-pointer rounded-full ri-skip-back-mini-fill"
              ></i>
              <audio
                className="w-[80%] "
                controls
                autoPlay
                onEnded={next}
                src={e.downloadUrl[4]?.url}
              ></audio>
              <i
                onClick={next}
                className=" text-3xl text-white bg-zinc-800 cursor-pointer rounded-full ri-skip-right-fill"
              ></i>
            </motion.div>
            <div className="sm:hidden flex flex-col text-[1vw] items-center  gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-400">
                  Download Options
                </h3>
              </div>
              <div className="flex flex-row-reverse gap-2 ">
                <p
                  onClick={() =>
                    handleDownloadSong(
                      e.downloadUrl[0].url,
                      e.name + " (12kbps)"
                    )
                  }
                  className="duration-300 cursor-pointer hover:text-slate-400 hover:bg-slate-600 hover:scale-90 w-fit p-1 font-semibold rounded-md shadow-2xl bg-slate-400 flex flex-col items-center"
                >
                  12kbps <br />
                  <p className="text-xs">Very low quality</p>
                </p>
                <p
                  onClick={() =>
                    handleDownloadSong(
                      e.downloadUrl[1].url,
                      e.name + " (48kbps)"
                    )
                  }
                  className="duration-300 cursor-pointer  hover:text-slate-400 hover:bg-slate-600 hover:scale-90 w-fit p-1 font-semibold rounded-md shadow-2xl bg-slate-400 flex flex-col items-center"
                >
                  48kbps <br />
                  <p className="text-xs">Low quality</p>
                </p>
                <p
                  onClick={() =>
                    handleDownloadSong(
                      e.downloadUrl[2].url,
                      e.name + " (96kbps)"
                    )
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
                      e.name + " (160kbps)"
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
                      e.name + " (320kbps)"
                    )
                  }
                  className="duration-300 cursor-pointer  hover:text-slate-400 hover:bg-slate-600 hover:scale-90 w-fit p-1 font-semibold rounded-md shadow-2xl bg-slate-400 flex flex-col items-center"
                >
                  320kbps <br />
                  <p className="text-xs"> High quality</p>
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div> : <h1>NO DATA</h1>}
     
    </div>
  );
}

export default Likes;
