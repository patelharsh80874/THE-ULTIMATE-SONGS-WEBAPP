import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "./../../public/logo3.jpg";
import axios from "axios";
import Loading from "./Loading";
import Dropdown from "react-dropdown";
import "react-dropdown/style.css";

const Home = () => {
  const [home, sethome] = useState(null);
  const [language, setlanguage] = useState("hindi")
  const options = ["hindi", "english", "punjabi", "tamil", "telugu", "marathi", "gujarati", "bengali", "kannada", "bhojpuri", "malayalam", "urdu", "haryanvi", "rajasthani", "odia", "assamese"];
  

  const Gethome = async () => {
    try {
      const { data } = await axios.get(
        `https://saavn.dev/modules?language=${language}`
      );
      sethome(data.data);
    } catch (error) {
      console.log("error", error);
    }
  };

  function seccall() {
    const intervalId = setInterval(() => {
      if (home === null) {
        // sethome([])
        Gethome();
      }
    }, 1000);
    return intervalId;
  }

  useEffect(() => {
    var interval = seccall();
        //  Gethome();
    return () => clearInterval(interval);
  }, [language , home]);


  useEffect(() => {
    Gethome();
  }, [language]);

  return home ? (
    <div className="w-full min-h-screen bg-slate-800">
      <div className="logo h-[15vh] flex sm:block bg-gray-500 px-10 sm:px-5  items-center  gap-3 ">
        <div className="flex items-center sm:justify-center sm:pt-2 gap-3">
          <img className="w-[5vw] sm:w-[15vw] rounded-full" src={logo} alt="" />
          <h1 className="text-2xl sm:text-xl  font-black">
            THE ULTIMATE SONGS
          </h1>
        </div>
        <div className="sm:flex sm:mt-3 sm:justify-center">
          <Link
            className=" text-xl sm:text-sm ml-3 sm:font-bold text-blue-900 font-semibold "
            to={"/download"}
          >
            Download Songs
          </Link>
          <Link
            className=" text-xl sm:text-sm ml-3 sm:font-bold text-blue-900 font-semibold "
            to={"/playlist"}
          >
            PlayLists
          </Link>
          <Link
            className=" text-xl sm:text-sm ml-3 sm:font-bold text-blue-900 font-semibold "
            to={"/artists"}
          >
            Artists
          </Link>
        </div>
      </div>
      <div className="w-full min-h-[85vh]  text-zinc-300 p-5 flex flex-col gap-5 overflow-auto ">
        <div className="w-full   flex justify-end ">
        <Dropdown className="w-[15%] text-sm sm:w-[50%]"
          options={options}
          onChange={(e)=>setlanguage(e.value)}
          placeholder="Select language"
        />
        </div>
        
        <div className="trending flex flex-col gap-3 w-full ">
          <h3 className="text-xl h-[5vh] font-semibold">Trending</h3>
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
        </div>
        <div className="charts w-full flex flex-col gap-3   ">
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
        </div>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default Home;
