import React, { useEffect } from "react";
import { BiLogOut } from "react-icons/bi";
import { Link } from "react-router-dom";
import { googleLogout } from "@react-oauth/google";
import "./Auth.css";
import { useDispatch } from "react-redux";
import { setcurrentuser } from "../../action/currentuser";

const Auth = ({ user, setauthbtn, seteditcreatechanelbtn }) => {
  const [isSubscibedClick, setIsSubscribedClick] = React.useState(false);
  const dispatch = useDispatch();
  const logout = () => {
    dispatch(setcurrentuser(null));
    localStorage.clear();
    googleLogout();
  };
  const handleSubcription = (e) => {
    e.stopPropagation();
    setIsSubscribedClick((prev) => !prev);
  };
  return (
    <div className="Auth_container" onClick={() => setauthbtn(false)}>
      <div className="Auth_container2">
        <p className="User_Details">
          <div className="Chanel_logo_App">
            <p className="fstChar_logo_App">
              {user?.username ? (
                <>{user?.username.charAt(0).toUpperCase()}</>
              ) : (
                <>{user?.email.charAt(0).toUpperCase()}</>
              )}
            </p>
          </div>
          <div className="email_auth">{user?.email}</div>
          <br />
        </p>
        <br />
        <button className="btn_Auth" onClick={handleSubcription}>
          Choose your subscription
        </button>
        <div className="btns_Auths">
          {isSubscibedClick && (
            <div>
              <div className="sub_list">
                <div>
                  <button
                    className="sub_btn"
                    style={{
                      color: "gold",
                      fontWeight: "bold",
                      backgroundColor: "black",
                      border: "1px solid gold",
                    }}
                  >
                    Gold Subscription{" "}
                  </button>
                </div>
                <div>
                  <button
                    className="sub_btn"
                    style={{
                      color: "silver",
                      fontWeight: "bold",
                      backgroundColor: "black",
                      border: "1px solid silver",
                    }}
                  >
                    Silver Subscription
                  </button>
                </div>
                <div>
                  <button
                    className="sub_btn"
                    style={{
                      color: "brown",
                      fontWeight: "bold",
                      backgroundColor: "black",
                      border: "1px solid brown",
                    }}
                  >
                    Bronze Subscription
                  </button>
                </div>
              </div>
            </div>
          )}
          {user?.username ? (
            <>
              {
                <Link to={`/channel/${user?.email}`} className="btn_Auth">
                  Your Channel
                </Link>
              }
            </>
          ) : (
            <>
              <input
                type="subnit"
                className="btn_Auth"
                value="Create Your Own Channel"
                onClick={() => seteditcreatechanelbtn(true)}
              />
            </>
          )}
          <div>
            <div className="btn_Auth" onClick={() => logout()}>
              <BiLogOut />
              Log Out
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
