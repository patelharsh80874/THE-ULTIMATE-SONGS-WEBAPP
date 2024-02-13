import React from "react";
import loader from "./../../public/loading.gif";

const Loading = () => {
  return (
    <div className="z-50 w-full h-full flex items-center justify-center bg-black">
      <img className="scale-150" src={loader} alt="" />
    </div>
  );
};

export default Loading;
