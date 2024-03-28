import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import wavs from "../../public/wavs.gif";
import { animate, circIn, circInOut, circOut, easeIn, easeInOut, easeOut, motion } from "framer-motion";
import { useAnimate, stagger } from "framer-motion";
import { Bounce, Expo, Power4, Sine } from "gsap/all";
import { Circ } from "gsap/all";

const Songs = () => {
  const navigate = useNavigate();
  const [query, setquery] = useState("");
  const [requery, setrequery] = useState("");
  const [search, setsearch] = useState([]);
  var [index, setindex] = useState("");
  const [songlink, setsonglink] = useState([]);
  var [page, setpage] = useState(1);

  const Getsearch = async () => {
    try {
      const { data } = await axios.get(
        `https://jiosaavan-api-2-harsh-patel.vercel.app/api/search/songs?query=${query}&page=${page}&limit=10`
        // `https://jiosaavan-harsh-patel.vercel.app/search/songs?query=${query}&page=${page}&limit=10`
      );

      setsearch((prevState) => [...prevState, ...data.data.results]);
    } catch (error) {
      console.log("error", error);
    }
  };

  function setdata() {
    setsearch([]);
    setsonglink([]);
    setindex("");
    setpage(1);
  }
  function audioseter(i) {
    setindex(i);
    setsonglink([search[i]]);
  }

  function next() {
    if (index < search.length - 1) {
      setindex(index++);
      audioseter(index);
    } else {
      setindex(0);
      setsonglink([search[0]]);
    }
  }
  function pre() {
    if (index > 0) {
      setindex(index--);
      audioseter(index);
    } else {
      setindex(search.length - 1);
      setsonglink([search[search.length - 1]]);
    }
  }

  const handleDownloadSong = async (url, name) => {
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

  function seccall() {
    const intervalId = setInterval(() => {
      if (
        (search.length >= 0 && page < 20) ||
        query.length !== requery.length
      ) {
        setpage(page + 1);
        Getsearch();
        setrequery(query);
      }
    }, 3000);
    return intervalId;
  }

  useEffect(() => {
    if (query.length > 0) {
      var interval = seccall();
    }

    return () => clearInterval(interval);
  }, [query, search, page]);

  useEffect(() => {
    if (query !== "") {
      setdata();
    }
  }, [query]);
  var title = songlink[0]?.name;

  document.title = `${title ? title : "THE ULTIMATE SONGS"}`;
// console.log(search);
  return (
    <div className="w-full h-screen bg-slate-700 ">
      <div className="search gap-3 w-full sm:w-full sm:h-[5vh] h-[10vh] flex items-center justify-center ">
        <i
          onClick={() => navigate(-1)}
          className="ml-5 cursor-pointer text-3xl bg-green-500 rounded-full ri-arrow-left-line"
        ></i>
        <i className=" text-2xl ri-search-2-line"></i>

        <input
          className=" bg-black rounded-md p-3 sm:text-sm text-white border-none outline-none w-[50%] sm:w-[70%] sm:h-[5vh] h-[10vh]"
          onChange={(e) => setquery(e.target.value)}
          placeholder="Search anything"
          type="search"
          name=""
          id=""
        />
      </div>
      <div className="w-full text-white p-10 sm:p-3 sm:gap-3 h-[70vh] overflow-y-auto flex sm:block flex-wrap gap-7 justify-center ">
        {search?.map((d, i) => (
          <motion.div
          initial={{  scale: 0 }}
          whileInView={{  scale: 1 }}
          transition={{ease:Circ.easeIn,duration:0.05}}
            key={i}
            onClick={() => audioseter(i)}
            className=" relative hover:scale-110 sm:hover:scale-100 duration-150 w-[15vw] sm:mb-3 sm:w-full sm:flex sm:items-center sm:gap-3  rounded-md h-[20vw] sm:h-[15vh] cursor-pointer  "
          >
            <img
              className=" w-full h-[15vw] sm:h-[15vh] sm:w-[15vh] rounded-md"
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
            <div className="flex flex-col">
            <h3
              className={`text-sm sm:text-xs  font-bold ${
                i === index && "text-green-300"
              }`}
            >
              {d.name}
            </h3>
            <h4 className="text-xs sm:text-[2.5vw] text-zinc-300 ">{d.album.name}</h4>
            </div>
            
          </motion.div>
        ))}
        {search.length>0 && <div className="flex gap-3 text-2xl  ">
          <h1>MADE BY ❤️ HARSH PATEL</h1>
          <a
            target="_blank"
            href="https://www.instagram.com/harsh_patel_80874/"
          >
            <i className=" ri-instagram-fill"></i>
          </a>
        </div>}
        
      </div>
      <motion.div className={songlink.length > 0 ? ` duration-700 flex rounded-full sm:rounded-none sm:rounded-t-[30%]  gap-3 items-center  w-full min-h-[20vh] sm:min-h-[25vh] bg-slate-600 `: 'block'}>
         {songlink?.map((e, i) => (
          <motion.div
          initial={{ y: 50, opacity: 0,scale:0}}
          animate={{ y: 0, opacity: 1,scale:1 }}
            key={i}
            className="flex sm:block w-[70%] sm:w-full sm:h-full items-center justify-center gap-3"
          >
            <motion.div 
            initial={{ x: -50, opacity: 0,scale:0 }}
            animate={{ x: 0, opacity: 1,scale:1 }}
            className="w-[25vw] sm:w-full  flex gap-3 items-center sm:justify-center rounded-md  h-[7vw] sm:h-[30vw]">
              <motion.img
              initial={{ x: -50, opacity: 0,scale:0 }}
              animate={{ x: 0, opacity: 1,scale:1 }}
                className="rounded-md h-[7vw] sm:h-[25vw]"
                src={e.image[2]?.url}
                alt=""
              />
              <h3 className=" sm:w-[30%] text-white text-sm font-semibold">
                {e.name}
              </h3>
              <i
                onClick={() =>
                  handleDownloadSong(
                    e.downloadUrl[4].url,
                    e.name,
                  )
                }
                className=" flex cursor-pointer  items-center justify-center bg-green-700 sm:w-[9vw] sm:h-[9vw] w-[3vw] h-[3vw]   rounded-full text-2xl ri-download-line"
              ></i>
            </motion.div>
            <motion.div 
             initial={{ y: 50, opacity: 0,scale:0 }}
             animate={{ y: 0, opacity: 1,scale:1 }}
            className="w-[55%]  sm:w-full h-[10vh] flex gap-3 sm:gap-1 items-center justify-center">
              <button
                onClick={pre}
                className="text-3xl text-white bg-zinc-800 cursor-pointer rounded-full"
              >
                <i className="ri-skip-back-mini-fill"></i>
              </button>
              <audio
                className="w-[80%]"
                controls
                autoPlay
                onEnded={next}
                src={e.downloadUrl[4]?.url}
              ></audio>
              <button
                onClick={next}
                className="text-3xl text-white bg-zinc-800 cursor-pointer rounded-full"
              >
                <i className="ri-skip-right-fill"></i>
              </button>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default Songs;
