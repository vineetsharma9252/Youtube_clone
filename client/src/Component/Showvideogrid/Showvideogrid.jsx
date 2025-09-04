import React from "react";
import "./Showvideogrid.css";
import Showvideo from "../Showvideo/Showvideo";
import { useSelector } from "react-redux";

const Showvideogrid = ({ vid }) => {
  const theme = useSelector((state) => state.theme_reducer.theme) || "dark"; // Read-only theme

  return (
    <div className={`Container_ShowVideoGrid ${theme}`}>
      {vid?.reverse().map((vi) => (
        <div key={vi._id} className="video_box_app">
          <Showvideo vid={vi} />
        </div>
      ))}
    </div>
  );
};

export default Showvideogrid;