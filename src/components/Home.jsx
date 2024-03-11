import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "./../../public/logo3.jpg";
import axios from "axios";
import Loading from "./Loading";
import Dropdown from "react-dropdown";
import "react-dropdown/style.css";
import wavs from "../../public/wavs.gif";

const Home = () => {
  const [home, sethome] = useState(null);
  const [language, setlanguage] = useState("hindi");
  const [details, setdetails] = useState([]);
  const [songlink, setsonglink] = useState([]);
  var [index, setindex] = useState("");
  var [page, setpage] = useState(1);
  const options = [
    "hindi",
    "english",
    "punjabi",
    "tamil",
    "telugu",
    "marathi",
    "gujarati",
    "bengali",
    "kannada",
    "bhojpuri",
    "malayalam",
    "urdu",
    "haryanvi",
    "rajasthani",
    "odia",
    "assamese",
  ];

  // const Getartists = async () => {
  //   detailsseter();
  // };
  const Getdetails = async () => {
    try {
      // const { data } = await axios.get(
      //   `https://saavn.dev/search/songs?query=${language}&page=${page}&limit=20`
      // );
      const { data } = await axios.get(
        `https://saavn.dev/api/search/songs?query=${language}&page=${page}&limit=20`
      );
      setdetails((prevState) => [...prevState, ...data.data.results]);
    } catch (error) {
      console.log("error", error);
    }
  };

  function audioseter(i) {
    setindex(i);
    setsonglink([details[i]]);
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

  const handleDownloadSong = async (url, name,) => {
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
  function detailsseter() {
    setpage(1);
    setindex("");
    setsonglink([]);
    setdetails([]);
  }

  // function seccall() {
  //   const intervalId = setInterval(() => {
  //     if (home === null) {
  //       // sethome([])
  //       Getartists();
  //     }
  //   }, 1000);
  //   return intervalId;
  // }
  function seccall2() {
    const intervalId2 = setInterval(() => {
      if (details.length >= 0 && page < 4) {
        setpage(page + 1);
        Getdetails();
      }
    }, 5000);
    return intervalId2;
  }

  useEffect(() => {
   detailsseter();
  }, [language]);

  // useEffect(() => {
  //   Getdetails();
  // }, [language]);

  useEffect(() => {
    var interval2 = seccall2();

    return () => clearInterval(interval2);
  }, [details, page, language]);

  var title = songlink[0]?.name;
  document.title = `${title ? title : "THE ULTIMATE SONGS"}`;
  // console.log(details);
  // console.log(home);
  // console.log(page);
  // console.log(index)
  return  details.length > 0 ? (
    <div className="w-full h-screen bg-slate-800">
      <div className="logo h-[15vh] sm:h-[10vh] flex sm:block bg-gray-500 px-10 sm:px-5  items-center  gap-3 ">
        <div className="flex items-center sm:justify-center sm:pt-2 gap-3">
          <img className="w-[5vw] sm:w-[10vw] rounded-full" src={logo} alt="" />
          <h1 className="text-2xl sm:text-xl  font-black">
            THE ULTIMATE SONGS
          </h1>
        </div>
        <div className="sm:flex   sm:justify-center">
        <h3 className="inline text-xl sm:text-sm" >Search : </h3>
          <Link
            className=" text-xl sm:text-sm ml-3 sm:font-bold text-blue-900 font-semibold "
            to={"/songs"}
          >
             Songs
          </Link>
          {/* <Link
            className=" text-xl sm:text-sm ml-3 sm:font-bold text-blue-900 font-semibold "
            to={"/download"}
          >
            Download Songs
          </Link> */}
          <Link
            className=" text-xl sm:text-sm ml-3 sm:font-bold text-blue-900 font-semibold "
            // to={"/playlist"}
          >
            PlayLists
          </Link>
          <Link
            className=" text-xl sm:text-sm ml-3 sm:font-bold text-blue-900 font-semibold "
            to={"/artists"}
          >
            Artists
          </Link>
          <Link
            className=" text-xl sm:text-sm ml-3 sm:font-bold text-blue-900 font-semibold "
            to={"/album"}
          >
            Album
          </Link>
        </div>
      </div>
      <div className="w-full h-[65vh]  text-zinc-300 p-5 flex flex-col gap-5 overflow-auto ">
        <div className="w-full   flex justify-end ">
          <Dropdown
            className="w-[15%] text-sm sm:w-[50%]"
            options={options}
            onChange={(e) => setlanguage(e.value)}
            placeholder="Select language"
          />
        </div>

        <div className="trending songs flex flex-col gap-3 w-full ">
          <h3 className="text-xl h-[5vh] font-semibold">{language} Songs</h3>
          <div className="songs px-5 sm:px-3 flex flex-shrink  gap-5 overflow-x-auto overflow-hidden w-full ">
            {details?.map((t, i) => (
              <Link
                onClick={() => audioseter(i)}
                key={i}
                className="relative hover:scale-110 sm:hover:scale-100  duration-150 flex-shrink-0 w-[15%] sm:w-[40%] rounded-md flex flex-col gap-2 py-4"
              >
                <img
                  className="relative w-full  rounded-md"
                  src={t.image[2].url}
                  alt=""
                />
                <img
                  className={`absolute top-4 w-[20%] sm:w-[25%] rounded-md ${
                    i === index ? "block" : "hidden"
                  } `}
                  src={wavs}
                  alt=""
                />
                <div className="flex flex-col">
                  <h3
                    className={`text-sm sm:text-xs leading-none  font-bold ${
                      i === index && "text-green-300"
                    }`}
                  >
                    {t.name}
                  </h3>
                  <h4 className="text-xs sm:text-[2.5vw] text-zinc-300 ">
                    {t.album.name}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* <div className="trending flex flex-col gap-3 w-full ">
          <h3 className="text-xl h-[5vh] font-semibold">Trending Albums</h3>
          <div className="playlistsdata px-5 sm:px-3 flex flex-shrink  gap-5 overflow-x-auto overflow-hidden w-full ">
            {home?.trending?.albums.map((t, i) => (
              <Link
                to={`/albums/details/${t.id}`}
                key={i}
                className="hover:scale-110 sm:hover:scale-100  duration-150 flex-shrink-0 w-[15%] sm:w-[40%] rounded-md flex flex-col gap-2 py-4"
              >
                <img
                  className="w-full  rounded-md"
                  src={t.image[2].link}
                  alt=""
                />
                
                <h3 className="leading-none ">{t.name}</h3>
              
              </Link>
            ))}
          </div>
        </div> */}
        {/* <div className="charts w-full flex flex-col gap-3   ">
          <h3 className="text-xl h-[5vh] font-semibold">Charts</h3>
          <div className="chartsdata px-5 sm:px-3 flex flex-shrink  gap-5 overflow-x-auto overflow-hidden w-full ">
            {home?.charts?.map((c, i) => (
              <Link
                to={`/playlist/details/${c.id}`}
                key={i}
                className="hover:scale-110 sm:hover:scale-100  duration-150 flex-shrink-0 w-[15%] sm:w-[40%] rounded-md flex flex-col gap-2 py-4"
              >
                <img
                  className="w-full  rounded-md"
                  src={c.image[2].link}
                  alt=""
                />
                <h3 className="leading-none">{c.title}</h3>
              </Link>
            ))}
          </div>
        </div>
        <div className="playlists w-full  flex flex-col gap-3 ">
          <h3 className="text-xl h-[5vh] font-semibold">Playlists</h3>
          <div className="playlistsdata px-5 sm:px-3 flex flex-shrink  gap-5 overflow-x-auto overflow-hidden w-full ">
            {home?.playlists?.map((p, i) => (
              <Link
                to={`/playlist/details/${p.id}`}
                key={i}
                className="hover:scale-110  sm:hover:scale-100  duration-150 flex-shrink-0 w-[15%] sm:w-[40%] rounded-md  flex flex-col gap-2 py-4"
              >
                <img
                  className="w-full  rounded-md"
                  src={p.image[2].link}
                  alt=""
                />
                <h3 className="leading-none">{p.title}</h3>
              </Link>
            ))}
          </div>
        </div>
        <div className="albums w-full flex flex-col gap-3 ">
          <h3 className="text-xl h-[5vh] font-semibold">Albums</h3>
          <div className="albumsdata px-5 sm:px-3 flex flex-shrink  gap-5 overflow-x-auto overflow-hidden w-full ">
            {home?.albums?.map((a, i) => (
              <Link
                to={`/albums/details/${a.id}`}
                key={i}
                className="hover:scale-110 sm:hover:scale-100  duration-150 flex-shrink-0 w-[15%] sm:w-[40%] rounded-md  flex flex-col gap-2 py-4"
              >
                <img
                  className="w-full  rounded-md"
                  src={a.image[2].link}
                  alt=""
                />
                <h3 className="leading-none">{a.name}</h3>
              </Link>
            ))}
          </div>
        </div> */}
      </div>
      <div className="flex  gap-3 items-center  w-full min-h-[20vh] sm:min-h-[25vh] bg-slate-600  ">
        {songlink?.map((e, i) => (
          <div
            key={i}
            className="flex sm:block w-[70%] sm:w-full sm:h-full items-center justify-center gap-3"
          >
            <div className="w-[25vw] sm:w-full  flex gap-3 items-center sm:justify-center rounded-md  h-[7vw] sm:h-[30vw]">
              <img
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
            </div>
            <div className="w-[55%]  sm:w-full h-[10vh] flex gap-3 sm:gap-1 items-center justify-center">
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
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default Home;
