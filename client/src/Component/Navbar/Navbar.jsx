import React, { useState, useEffect } from "react";
import logo from "./logo.ico";
import "./Navbar.css";
import { Link, useNavigate } from "react-router-dom";
import { RiVideoAddLine } from "react-icons/ri";
import { IoMdNotificationsOutline } from "react-icons/io";
import { BiUserCircle } from "react-icons/bi";
import Searchbar from "./Searchbar/Searchbar";
import Auth from "../../Pages/Auth/Auth";
import { setcurrentuser } from "../../action/currentuser";
import { jwtDecode } from "jwt-decode";
import { useDispatch, useSelector } from "react-redux";
import { changeTheme } from "../../action/theme";
import moment from "moment-timezone";
import { getSubscriptionTierFromEmail } from "../../action/subscription";

// Southern states latitude range (approximate for India)
const SOUTHERN_LATITUDE_RANGE = {
  min: 8.0,  // Southern tip of India
  max: 20.0  // Roughly the divide between North and South India
};

const Navbar = ({ toggledrawer, seteditcreatechanelbtn }) => {
  const [authbtn, setauthbtn] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isSouthernState, setIsSouthernState] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentuser = useSelector((state) => state.currentuserreducer);
  const theme = useSelector((state) => state.theme_reducer.theme) || "light";

  // Detect user's location
  useEffect(() => {
    // Try to get location from browser
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          console.log("User location:", position.coords);
          classifyStateByLatitude(position.coords.latitude);
        },
        (error) => {
          console.error("Geolocation error:", error.message);
          detectStateByIP();
        },
        {
          timeout: 10000,
          maximumAge: 300000,
          enableHighAccuracy: false,
        }
      );
    } else {
      console.log("Geolocation not supported. Using time-based theme only.");
    }
  }, []);

  // Classify state based on latitude
  const classifyStateByLatitude = (latitude) => {
    const isSouthern = latitude >= SOUTHERN_LATITUDE_RANGE.min && 
                      latitude <= SOUTHERN_LATITUDE_RANGE.max;
    setIsSouthernState(isSouthern);
    console.log(
      `Your location: ${latitude.toFixed(4)}°N, ${
        isSouthern ? "Southern" : "Northern"
      } region detected.`
    );
  };

  // Fallback method to detect state by IP (simplified)
  const detectStateByIP = () => {
    // This is a simplified version - in a real app, you'd use an IP geolocation service
    console.log("Using IP-based detection fallback");
    // For demo purposes, we'll assume non-southern by default
    setIsSouthernState(false);
  };

  // Initialize user from token
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    console.log("Token from localStorage:", token);

    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log("Decoded token:", decoded);

        const username =
          decoded.username ||
          decoded.name ||
          decoded.email?.split("@")[0] ||
          "User";
        const email = decoded.email || decoded.userId || "unknown@email.com";
        const subscriptionTier = decoded.subscriptionTier || "Bronze";

        console.log("Initial user data:", {
          username,
          token,
          email,
          subscriptionTier,
        });

        // First set the user with data from token
        dispatch(
          setcurrentuser({
            username,
            token,
            email,
            subscriptionTier,
          })
        );

        // Then fetch the latest subscription tier from the database
        getSubscriptionTierFromEmail(token)
          .then((fetchedSubscriptionTier) => {
            console.log("Fetched subscriptionTier:", fetchedSubscriptionTier);

            // Update only the subscription tier
            dispatch(
              setcurrentuser({
                username,
                token,
                email,
                subscriptionTier: fetchedSubscriptionTier,
              })
            );
          })
          .catch((error) => {
            console.error("Error fetching subscription tier by email:", error);
            // Keep the subscription tier from the token if fetch fails
          });
      } catch (error) {
        console.error("Token decode failed:", error);
        localStorage.removeItem("authToken");
      }
    }
  }, [dispatch]);

  // Sync theme with location and IST time
  useEffect(() => {
    const syncThemeWithLocationAndTime = () => {
      const now = moment().tz("Asia/Kolkata");
      const hour = now.hour();
      
      // For southern states: light theme between 10 AM to 12 PM
      if (isSouthernState === true) {
        const shouldBeLight = hour >= 10 && hour < 12;
        if ((shouldBeLight && theme !== "light") || (!shouldBeLight && theme !== "dark")) {
          dispatch(changeTheme());
        }
      } 
      // For non-southern states or unknown location: always dark theme
      else if (isSouthernState === false || isSouthernState === null) {
        if (theme !== "dark") {
          dispatch(changeTheme());
        }
      }
    };

    syncThemeWithLocationAndTime(); // Initial sync
    const interval = setInterval(syncThemeWithLocationAndTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [dispatch, theme, isSouthernState]);

  console.log("Current user in Navbar:", currentuser);
  console.log("And token is :", currentuser?.token);
  
  const logout = () => {
    dispatch(setcurrentuser(null));
    localStorage.removeItem("authToken");
    navigate("/");
  };

  const handleUpgradeTier = (tier) => {
    if (!currentuser) {
      alert("Please sign in to upgrade");
      return;
    }
    const tierPrices = { Silver: 5000, Gold: 7000 };
    const amount = tierPrices[tier] || 0;
    if (amount > 0) {
      navigate("/payment", {
        state: { tier, amount, email: currentuser.email },
      });
    } else {
      alert("Invalid tier for upgrade");
    }
  };

  const handleThemeToggle = () => {
    dispatch(changeTheme());
  };

  return (
    <>
      <div className={`Container_Navbar ${theme}`}>
        <div className="Burger_Logo_Navbar">
          <div className="burger" onClick={() => toggledrawer()}>
            <p></p>
            <p></p>
            <p></p>
          </div>
          <Link to={"/"} className="logo_div_Navbar">
            <img src={logo} alt="" />
            <p className="logo_title_navbar">Your-Tube</p>
          </Link>
        </div>
        <Searchbar />
        <RiVideoAddLine size={22} className={"vid_bell_Navbar"} />
        <div className="apps_Box">
          <p className="appBox"></p>
          <p className="appBox"></p>
          <p className="appBox"></p>
        </div>
        <button
          className="theme-toggle-btn"
          onClick={handleThemeToggle}
          style={{
            background: theme === "light" ? "#333" : "#fff",
            color: theme === "light" ? "#fff" : "#333",
            border: "none",
            borderRadius: "4px",
            padding: "5px 10px",
          }}
        >
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </button>
        <IoMdNotificationsOutline size={22} className={"vid_bell_Navbar"} />
        <Link to="/subscriptions" className="vid_bell_Navbar">
          Subscriptions
        </Link>
        <div className="Auth_cont_Navbar">
          {currentuser ? (
            <>
              <div className="Chanel_logo_App" onClick={() => setauthbtn(true)}>
                <p className="fstChar_logo_App">
                  {currentuser?.username?.charAt(0).toUpperCase()}
                </p>
              </div>
              <p className="user-tier">Tier: {currentuser.subscriptionTier}</p>
              {currentuser.subscriptionTier !== "Gold" && (
                <div className="upgrade-buttons">
                  <button
                    className="upgrade-btn silver"
                    onClick={() => handleUpgradeTier("Silver")}
                  >
                    Upgrade to Silver
                  </button>
                  <button
                    className="upgrade-btn gold"
                    onClick={() => handleUpgradeTier("Gold")}
                  >
                    Upgrade to Gold
                  </button>
                </div>
              )}
              <button className="logout-btn" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <p className="Auth_Btn" onClick={() => navigate("/login")}>
              <BiUserCircle size={22} />
              <b>Sign in</b>
            </p>
          )}
        </div>
      </div>
      {authbtn && currentuser && (
        <Auth
          seteditcreatechanelbtn={seteditcreatechanelbtn}
          setauthbtn={setauthbtn}
          user={currentuser}
        />
      )}
    </>
  );
};

export default Navbar;