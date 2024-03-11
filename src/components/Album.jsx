import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Album = () => {
  const navigate = useNavigate();
  const [query, setquery] = useState("");
  const [requery, setrequery] = useState("");
  const [albums, setalbums] = useState([]);
  const Getalbums = async () => {
    try {
      const { data } = await axios.get(
        `https://saavn.dev/api/search/albums?query=${query}&page=1&limit=10`
      );
      setalbums(data?.data?.results);
    } catch (error) {
      console.log("error", error);
    }
  };

  function seccall() {
    const intervalId = setInterval(() => {
      if (albums.length === 0 || query.length !== requery.length) {
        Getalbums();
        setrequery(query);
      }
    }, 1000);
    return intervalId;
  }
  useEffect(() => {
    if (query.length > 0) {
      var interval = seccall();
    }

    return () => clearInterval(interval);
  }, [query, albums]);
console.log(albums);
  return (
    <div className="w-full min-h-[100vh] bg-slate-700">
      <div className="w-full min-h-[100vh] ">
        <div className="search gap-3 w-full   sm:w-full h-[15vh] flex items-center justify-center ">
          <i
            onClick={() => navigate(-1)}
            className="ml-5 cursor-pointer text-3xl bg-green-500 rounded-full ri-arrow-left-line"
          ></i>
          <i className=" text-2xl ri-search-2-line"></i>

          <input
            className=" bg-black rounded-md p-3 sm:text-sm text-white border-none outline-none w-[50%] sm:w-[70%] h-[10vh]"
            onChange={(e) => setquery(e.target.value)}
            placeholder="Search Albums  "
            type="search"
            name=""
            id=""
          />
        </div>
        <div className="w-full min-h-[85vh]  sm:min-h-[85vh] flex flex-wrap p-5  gap-5  justify-center   bg-slate-700">
          {albums?.map((e, i) => (
            <Link
              key={i}
              to={`/albums/details/${e.id}`}
              className="w-[15vw] h-[30vh] sm:w-[40vw] mb-8 sm:h-[20vh] sm:mb-12 rounded-md bg-red-200"
            >
              <img
                className="w-full h-full object-fill rounded-md"
                src={e?.image[2]?.url}
                alt=""
              />
              <h3 className="text-white">{e.name}</h3>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Album