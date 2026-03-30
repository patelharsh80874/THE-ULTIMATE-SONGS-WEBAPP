import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import wavs from "../../public/wavs.gif";
import { motion } from "framer-motion";
import { Circ } from "gsap/all";
import InfiniteScroll from "react-infinite-scroll-component";
import useLikedSongs from "../hooks/useLikedSongs";
import { usePlayer } from "../context/PlayerContext";
import { searchSongs } from "../services/api";

const Songs = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [requery, setRequery] = useState("");
  const [search, setSearch] = useState([]);
  const [page, setPage] = useState(null);
  const [searchclick, setSearchclick] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const { playSong, songlink, isPlaying, addToQueue } = usePlayer();
  const { isLiked, toggleLike } = useLikedSongs();

  const getSearch = async () => {
    try {
      if (hasMore === false) {
        setPage(page + 1);
        toast(`SEARCHING NEW SONGS IN PAGE ${page} `, {
          icon: "🔃",
          duration: 1000,
          style: { borderRadius: "10px", background: "rgb(115 115 115)", color: "#fff" },
        });
      }
      const { data } = await searchSongs(requery, page);
      if (hasMore) {
        const newData = data.data.results.filter(
          (newItem) => !search.some((prevItem) => prevItem.id === newItem.id)
        );
        setSearch((prev) => [...prev, ...newData]);
        setHasMore(newData.length > 0);
        setPage(page + 1);
      } else {
        const newData = data.data.results.filter(
          (newItem) => !search.some((prevItem) => prevItem.id === newItem.id)
        );
        if (newData.length > 0) {
          setSearch((prev) => [...prev, ...newData]);
        } else {
          toast(
            `NO MORE NEW SONGS FOUND IN PAGE ${page} , CLICK ON (LOAD MORE) AGAIN TO CHECK NEXT PAGE `,
            {
              icon: "⚠️",
              duration: 2000,
              style: { borderRadius: "10px", background: "rgb(115 115 115)", color: "#fff" },
            }
          );
        }
      }
    } catch (error) {
      console.log("error", error);
    }
  };

  function searchClick() {
    if (query !== requery) {
      toast.success(`Searching ${query} , Wait For Results`);
      setSearch([]);
      setHasMore(true);
      setPage(1);
      setRequery(query);
      setSearchclick(!searchclick);
    } else {
      toast.error(`Please Check Your Search Query , Its Same As Before `);
    }
  }

  function newdata() {
    if (page >= 2) {
      setTimeout(() => {
        getSearch();
      }, 1000);
    }
  }

  useEffect(() => {
    setTimeout(() => {
      if (requery.length > 0) {
        getSearch();
      }
    }, 1000);
  }, [searchclick]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7 }}
      className="w-full  min-h-screen overflow-hidden bg-slate-700 "
    >
      <motion.div
        initial={{ y: -50, scale: 0 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ ease: Circ.easeIn, duration: 0.7, delay: 0.7 }}
        className="search fixed  z-[99]  backdrop-blur-xl  gap-3 w-full sm:w-full sm:max-h-[5vh] max-h-[10vh] py-8 flex items-center justify-center "
      >
        <i
          onClick={() => navigate(-1)}
          className="ml-5 cursor-pointer text-3xl bg-green-500 rounded-full ri-arrow-left-line"
        ></i>
        <input
          className=" bg-black  rounded-md p-3 sm:text-sm text-white border-none outline-none w-[50%] sm:w-[50%] sm:max-h-[5vh] max-h-[8vh]"
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Songs"
          type="search"
        />
        <h3
          onClick={() => searchClick()}
          className="duration-300 cursor-pointer hover:text-slate-400 text-base  bg-slate-400 p-2 rounded-md hover:bg-slate-600 hover:scale-90"
        >
          Search <i className="  ri-search-2-line"></i>
        </h3>
      </motion.div>

      <InfiniteScroll
        dataLength={search.length}
        next={newdata}
        hasMore={hasMore}
        loader={page > 2 && <h1 className="bg-slate-700 text-zinc-300">Loading...</h1>}
        endMessage={<p className="bg-slate-700 text-zinc-300">No more items</p>}
      >
        <div className="pt-[10vh] pb-[30vh]  overflow-hidden overflow-y-auto">
          <div className="flex w-full bg-slate-700  text-white p-10 sm:p-3 sm:gap-3  sm:block flex-wrap gap-5 justify-center ">
            {search?.map((d, i) => (
              <div
                title="click on song image or name to play the song"
                key={i}
                className="items-center justify-center relative hover:scale-95 sm:hover:scale-100 duration-150 w-[40%] flex mb-3 sm:mb-3 sm:w-full sm:flex sm:items-center sm:gap-3  rounded-md h-[10vw] sm:h-[15vh] cursor-pointer bg-slate-600  "
              >
                <div onClick={() => playSong(d, i, search)} className="flex w-[80%] items-center">
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
                    className={`absolute top-0 w-[8%] sm:w-[10%] rounded-md ${d.id === songlink[0]?.id ? "block" : "hidden"} `}
                    src={wavs}
                    alt=""
                  />
                  {songlink.length > 0 && (
                    <i
                      className={`absolute top-0 sm:h-[15vh] w-[10vw] h-full flex items-center justify-center text-5xl sm:w-[15vh]  opacity-90  duration-300 rounded-md ${d.id === songlink[0]?.id ? "block" : "hidden"} ${isPlaying ? "ri-pause-circle-fill" : "ri-play-circle-fill"}`}
                    ></i>
                  )}
                  <div className="ml-3 sm:ml-3 flex justify-center items-center gap-5 mt-2">
                    <div className="flex flex-col">
                      <h3 className={`text-sm sm:text-xs leading-none  font-bold ${d.id === songlink[0]?.id && "text-green-300"}`}>{d.name}</h3>
                      <h4 className="text-xs sm:text-[2.5vw] text-zinc-300 ">{d.album.name}</h4>
                    </div>
                  </div>
                </div>

                <i
                  title="Add to Queue"
                  onClick={(e) => { e.stopPropagation(); const added = addToQueue(d); if (added) toast.success(`Added to queue`, { duration: 1000 }); else toast(`Already in queue`, { icon: '⚠️', duration: 1000 }); }}
                  className="text-xl flex w-[3vw] sm:w-[9vw] rounded-full justify-center items-center h-[3vw] sm:h-[9vw] duration-300 cursor-pointer text-zinc-300 hover:text-green-400 ri-play-list-add-line"
                ></i>
                {isLiked(d?.id) ? (
                  <i
                    title="Unlike"
                    onClick={() => toggleLike(d)}
                    className={` text-xl flex w-[3vw] sm:w-[9vw] rounded-full justify-center items-center h-[3vw] sm:h-[9vw]   duration-300 cursor-pointer text-red-500  ri-heart-3-fill`}
                  ></i>
                ) : (
                  <i
                    title="Like"
                    onClick={() => toggleLike(d)}
                    className={` text-xl flex w-[3vw] sm:w-[9vw] rounded-full justify-center items-center h-[3vw] sm:h-[9vw]   duration-300 cursor-pointer text-zinc-300  ri-heart-3-fill`}
                  ></i>
                )}
              </div>
            ))}

            {search.length > 0 && !hasMore && (
              <div className={`w-full flex flex-col items-center  justify-center`}>
                <button onClick={newdata} className={` bg-red-400 shadow-2xl py-2 px-1 rounded-md`}>Load more</button>
                <span>wait for some seconds after click</span>
              </div>
            )}
          </div>
        </div>
      </InfiniteScroll>
    </motion.div>
  );
};

export default Songs;

