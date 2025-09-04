import React from "react";
import Leftsidebar from "../../Component/Leftsidebar/Leftsidebar";
import "./Home.css";
import Showvideogrid from "../../Component/Showvideogrid/Showvideogrid";
import { useSelector } from "react-redux";

const Home = () => {
  const vids = useSelector((state) => state.videoreducer)
    ?.data?.filter((q) => q)
    .reverse();
  const theme = useSelector((state) => state.theme_reducer.theme) || "dark"; // Read-only theme

  const navlist = [
    "All",
    "Python",
    "Java",
    "C++",
    "Movies",
    "Science",
    "Animation",
    "Gaming",
    "Comedy",
  ];

  console.log("Current theme in Home:", theme);

  return (
    <div className={`container_Pages_App ${theme}`}>
      <Leftsidebar />
      <div className="container2_Pages_App">
        <div className="navigation_Home">
          {navlist.map((m) => (
            <p key={m} className="btn_nav_home">
              {m}
            </p>
          ))}
        </div>
        <Showvideogrid vid={vids} />
      </div>
    </div>
  );
};

export default Home;