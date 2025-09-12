import React, { useEffect, useState } from "react";
import { BiLogOut } from "react-icons/bi";
import { Link } from "react-router-dom";
import { googleLogout } from "@react-oauth/google";
import "./Auth.css";
import { useDispatch, useSelector } from "react-redux";
import { setcurrentuser } from "../../action/currentuser";
import { getUserProfile } from "../../action/profile"; // Assuming this action exists
import { useNavigate } from "react-router-dom";

const Auth = ({ user, setauthbtn, seteditcreatechanelbtn }) => {
  const [isSubscibedClick, setIsSubscribedClick] = useState(false);
  const [downloadedVideos, setDownloadedVideos] = useState([]);
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.profileReducer); // Assuming profileReducer exists
  const navigate = useNavigate();
  useEffect(() => {
    if (user?.email) {
      dispatch(getUserProfile(user.email)).then(() => {
        setDownloadedVideos(profile?.downloadedVideos || []);
      });
    }
  }, [dispatch, user?.email, profile?.downloadedVideos]);

  const logout = () => {
    dispatch(setcurrentuser(null));
    localStorage.removeItem("authToken");
    googleLogout();
    setauthbtn(false);
  };

  const handleSubcription = (e) => {
    e.stopPropagation();
    setIsSubscribedClick((prev) => !prev);
  };

  const handleUpgradeTier = (tier) => {
    const tierPrices = {Bronze:1000 , Silver: 5000, Gold: 7000 };
    const amount = tierPrices[tier] || 0;
    if (amount > 0) {
      navigate("/payment", { state: { tier, amount, email: user.email } });
    }
    setauthbtn(false);
  };

  return (
    <div className="Auth_container" onClick={() => setauthbtn(false)}>
      <div className="Auth_container2" onClick={(e) => e.stopPropagation()}>
        <p className="User_Details">
          <div className="Chanel_logo_App">
            <p className="fstChar_logo_App">
              {user?.username ? (
                <>{user?.username.charAt(0).toUpperCase()}</>
              ) : (
                <>{user?.email?.charAt(0).toUpperCase()}</>
              )}
            </p>
          </div>
          <div className="email_auth">{user?.email}</div>
          <div className="tier_auth">
            Tier: {user?.subscriptionTier || "Bronze"}
          </div>
        </p>
        <br />
        <button className="btn_Auth" onClick={handleSubcription}>
          Choose your subscription
        </button>

        {isSubscibedClick && (
          <div className="subscription-options">
            <div className="sub_list">
              <div>
                <button
                  className="sub_btn gold"
                  onClick={() => handleUpgradeTier("Gold")}
                >
                  Gold Subscription - ₹70
                </button>
              </div>
              <div>
                <button
                  className="sub_btn silver"
                  onClick={() => handleUpgradeTier("Silver")}
                >
                  Silver Subscription - ₹50
                </button>
              </div>
              <div>
                <button className="sub_btn bronze" onClick={() => handleUpgradeTier("Bronze")}>
                  Bronze Subscription - ₹10
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="btns_Auths">
          {user?.username ? (
            <Link
              to={`/channel/${user?.email}`}
              className="btn_Auth"
              onClick={() => setauthbtn(false)}
            >
              Your Channel
            </Link>
          ) : (
            <button
              className="btn_Auth"
              onClick={() => {
                seteditcreatechanelbtn(true);
                setauthbtn(false);
              }}
            >
              Create Your Own Channel
            </button>
          )}

          <div className="btn_Auth logout-btn" onClick={logout}>
            <BiLogOut />
            Log Out
          </div>
        </div>

        {/* Display Downloaded Videos */}
        <div className="downloaded-videos-section">
          <h3>Downloaded Videos</h3>
          {downloadedVideos.length > 0 ? (
            <ul>
              {downloadedVideos.map((video) => (
                <li key={video.videoid}>
                  {video.title || `Video ${video.videoid}`}
                </li>
              ))}
            </ul>
          ) : (
            <p>No downloaded videos yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
