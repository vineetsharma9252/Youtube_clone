import { useEffect } from "react";
import Leftsidebar from "../../Component/Leftsidebar/Leftsidebar";
import "./Home.css";
import Showvideogrid from "../../Component/Showvideogrid/Showvideogrid";
import { useSelector, useDispatch } from "react-redux";
import { changeTheme } from "../../action/theme";
import moment from "moment-timezone";

const Home = () => {
  const vids = useSelector((state) => state.videoreducer)?.data?.filter(q => q).reverse();
  const theme = useSelector((state) => state.theme_reducer.theme) || "dark";
  const dispatch = useDispatch();

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

  // Set theme based on IST time (10 AM to 12 PM)
  useEffect(() => {
    const now = moment().tz("Asia/Kolkata"); // IST (UTC+5:30)
    const hour = now.hour();
    const shouldBeLight = hour >= 10 && hour < 12; // 10 AM to 12 PM IST
    if ((shouldBeLight && theme !== "light") || (!shouldBeLight && theme !== "dark")) {
      dispatch(changeTheme());
    }
  }, [dispatch, theme]);

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