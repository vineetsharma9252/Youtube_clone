import React, { useState, useEffect } from "react";
import logo from "./logo.ico";
import "./Navbar.css";
import { useDispatch, useSelector } from "react-redux";
import { Link, generatePath } from "react-router-dom";
import { RiVideoAddLine } from "react-icons/ri";
import { IoMdNotificationsOutline } from "react-icons/io";
import { BiUserCircle } from "react-icons/bi";
import Searchbar from "./Searchbar/Searchbar";
import Auth from "../../Pages/Auth/Auth";
import axios from "axios";
import { login } from "../../action/auth";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";
import { setcurrentuser } from "../../action/currentuser";
import { jwtDecode } from "jwt-decode";
import { changeTheme } from "../../action/theme";

const Navbar = ({ toggledrawer, seteditcreatechanelbtn }) => {
  const [authbtn, setauthbtn] = useState(false);
  const [user, setuser] = useState(null);
  const [profile, setprofile] = useState([]);
  const dispatch = useDispatch();
  const currentuser = useSelector((state) => state.currentuserreducer);
  console.log("Current user:", currentuser);
  const theme = useSelector((state) => state.theme_reducer.theme);

  const successlogin = () => {
    if (profile.email) {
      console.log("Dispatching login for email:", profile.email);
      dispatch(login({ email: profile.email }));
    }
  };

  const google_login = useGoogleLogin({
    onSuccess: (tokenResponse) => setuser(tokenResponse),
    onError: (error) => console.log("Google Login Failed:", error),
  });

  useEffect(() => {
    if (user) {
      axios
        .get("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: {
            Authorization: `Bearer ${user.access_token}`,
            Accept: "application/json",
          },
        })
        .then(async (res) => {
          console.log("Google user info:", res.data);
          try {
            const response = await axios.post(
              "http://localhost:5000/user/login",
              {
                email: res.data.email,
              }
            );
            console.log("Backend login response:", response.data);
            const { result, token } = response.data;
            localStorage.setItem(
              "Profile",
              JSON.stringify({
                username: res.data.name,
                token,
                email: res.data.email,
                subscriptionTier: result.subscriptionTier || "Bronze",
              })
            );
            setprofile(res.data);
            dispatch(
              setcurrentuser({
                username: res.data.name,
                token,
                email: res.data.email,
                subscriptionTier: result.subscriptionTier || "Bronze",
              })
            );
            successlogin();
          } catch (error) {
            console.error(
              "Backend login failed:",
              error.response?.data?.error || error.message
            );
          }
        })
        .catch((err) => {
          console.error("Google user info fetch failed:", err);
        });
    }
  }, [user]);

  const logout = () => {
    dispatch(setcurrentuser(null));
    googleLogout();
    localStorage.clear();
    setprofile([]);
    setuser(null);
  };

  const handleUpgradeTier = async (tier) => {
    if (!currentuser) {
      alert("Please sign in to upgrade");
      return;
    }
    console.log("tier clicked ", tier);
    console.log("current user token is ", currentuser.token);
    try {
      const response = await axios.post(
        "http://localhost:5000/subscriptions/upgrade-tier",
        { tier },
        { headers: { Authorization: `Bearer ${currentuser.token}` } }
      );
      console.log("Upgrade response:", response.data);
      const { user, token } = response.data;
      localStorage.setItem(
        "Profile",
        JSON.stringify({
          username: user.email.split("@")[0],
          token,
          email: user.email,
          subscriptionTier: user.subscriptionTier,
        })
      );
      dispatch(
        setcurrentuser({
          username: user.email.split("@")[0],
          token,
          email: user.email,
          subscriptionTier: user.subscriptionTier,
        })
      );
    } catch (error) {
      console.error(
        "Upgrade failed:",
        error.response?.data?.error || error.message
      );
      alert(
        "Upgrade failed: " +
          (error.response?.data?.error || "Something went wrong")
      );
    }
  };

  useEffect(() => {
    const token = currentuser?.token;
    console.log("Current user token:", token);
    console.log("Type of token:", typeof token);
    if (typeof token === "string" && token.split(".").length === 3) {
      try {
        const decodetoken = jwtDecode(token);
        console.log("Decoded token:", decodetoken);
        if (decodetoken.exp * 1000 < new Date().getTime()) {
          console.log("Token expired, logging out");
          logout();
        }
      } catch (error) {
        console.error("Token decode failed:", error.message);
        logout();
      }
    }
    dispatch(setcurrentuser(JSON.parse(localStorage.getItem("Profile"))));
  }, [currentuser?.token, dispatch]);

  return (
    <>
      <div className={`Container_Navbar ${theme || "dark"}`}>
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
          onClick={() => dispatch(changeTheme())}
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
                  {currentuser?.username ? (
                    <>{currentuser.username.charAt(0).toUpperCase()}</>
                  ) : (
                    ""
                  )}
                </p>
              </div>
              <p>Tier: {currentuser.subscriptionTier}</p>
              {currentuser.subscriptionTier !== "Gold" && (
                <div>
                  <button onClick={() => handleUpgradeTier("Silver")}>
                    Upgrade to Silver
                  </button>
                  <button onClick={() => handleUpgradeTier("Gold")}>
                    Upgrade to Gold
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="Auth_Btn" onClick={() => google_login()}>
                <BiUserCircle size={22} />
                <b>Sign in</b>
              </p>
            </>
          )}
        </div>
      </div>
      {authbtn && (
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