import React, { useEffect, useRef } from "react";
import "./Videopage.css";
import moment from "moment-timezone";
import Likewatchlatersavebtns from "./Likewatchlatersavebtns";
import { useParams, Link, useNavigate } from "react-router-dom";
import Comment from "../../Component/Comment/Comment";
import { viewvideo, getallvideo } from "../../action/video";
import { addtohistory } from "../../action/history";
import { changeTheme } from "../../action/theme";
import { useSelector, useDispatch } from "react-redux";

const Videopage = () => {
  const { vid } = useParams();
  const dispatch = useDispatch();
  const vids = useSelector((state) => state.videoreducer);
  const currentuser = useSelector((state) => state.currentuserreducer);
  const theme = useSelector((state) => state.theme_reducer.theme) || "light";
  const navigate = useNavigate();
  const videoRef = useRef(null);
  let lastTap = 0;
  const tapThreshold = 300; // ms
  let tapCount = 0;

  const vv = vids?.data?.find((q) => q._id.toString() === vid);
  console.log("Video data:", vv);
  const currentIndex = vids?.data?.findIndex((q) => q._id.toString() === vid);

  const handleviews = () => {
    dispatch(viewvideo({ id: vid }));
  };

  const handlehistory = () => {
    dispatch(
      addtohistory({
        videoid: vid,
        viewer: currentuser?.token,
      })
    );
  };

  // Set theme based on IST time (10 AM to 12 PM)
  useEffect(() => {
    const now = moment().tz("Asia/Kolkata");
    const hour = now.hour();
    const shouldBeLight = hour >= 10 && hour < 12;
    if (
      (shouldBeLight && theme !== "light") ||
      (!shouldBeLight && theme !== "dark")
    ) {
      dispatch(changeTheme());
    }
  }, [dispatch, theme]);

  useEffect(() => {
    dispatch(getallvideo());
    handleviews();
    if (currentuser?.token) {
      handlehistory();
    }
  }, [dispatch, vid]);

  // Gesture controls
  const handleVideoTap = (event) => {
    event.preventDefault(); // Prevent default zoom or scroll
    const rect = videoRef.current.getBoundingClientRect();
    const tapX = event.touches ? event.touches[0].clientX : event.clientX;
    const tapPosition = (tapX - rect.left) / rect.width;
    const currentTime = new Date().getTime();
    const tapDelta = currentTime - lastTap;

    console.log(
      "Tap - Position:",
      tapPosition.toFixed(2),
      "Delta:",
      tapDelta,
      "Count:",
      tapCount + 1,
      "Event:",
      event.type
    );

    if (tapDelta < tapThreshold) {
      tapCount++;
      if (tapCount === 2) {
        if (tapPosition > 0.66) {
          videoRef.current.currentTime += 10;
          console.log("Double-tap right - Skipped 10s");
        } else if (tapPosition < 0.33) {
          videoRef.current.currentTime = Math.max(
            0,
            videoRef.current.currentTime - 10
          );
          console.log("Double-tap left - Rewound 10s");
        }
      } else if (tapCount === 3) {
        if (tapPosition > 0.66) {
          navigate("/");
          console.log("Three-tap right - Redirected to homepage");
        } else if (tapPosition < 0.33) {
          const commentSection = document.querySelector(".comments_VideoPage");
          if (commentSection)
            commentSection.scrollIntoView({ behavior: "smooth" });
          console.log("Three-tap left - Scrolled to comments");
        } else {
          const nextVideoIndex = currentIndex + 1;
          if (nextVideoIndex < vids.data.length) {
            navigate(`/videopage/${vids.data[nextVideoIndex]._id}`);
          }
          console.log("Three-tap middle - Moved to next video");
        }
        tapCount = 0; // Reset after three taps
      }
    } else {
      tapCount = 1;
      if (tapPosition >= 0.33 && tapPosition <= 0.66) {
        if (videoRef.current.paused) videoRef.current.play();
        else videoRef.current.pause();
        console.log("Single-tap middle - Toggled play/pause");
      }
    }
    lastTap = currentTime;
  };
  console.log("Current video: ", vv);
  if (!vv) {
    return (
      <div className={`yt-spinner-container ${theme}`}>
        <div className="yt-spinner"></div>
      </div>
    );
  }

  return (
    <div className={`container_videoPage ${theme}`}>
      <div className="container2_videoPage">
        <div className="video_display_screen_videoPage">
          <div
            className="custom-video-player"
            onTouchStart={handleVideoTap}
            onTouchEnd={handleVideoTap}
            onClick={handleVideoTap}
          >
            <video
              src={`${vv?.filepath}`}
              className="video_ShowVideo_videoPage"
              ref={videoRef}
              controls
            ></video>
          </div>
          <div className="video_details_videoPage">
            <div className="video_btns_title_VideoPage_cont">
              <p className="video_title_VideoPage">{vv?.title}</p>
              <div className="views_date_btns_VideoPage">
                <div className="views_videoPage">
                  {vv?.views} views <div className="dot"></div>{" "}
                  {moment(vv?.createdat).fromNow()}
                </div>
                <Likewatchlatersavebtns
                  vv={vv}
                  vid={vid}
                  currentuser={currentuser}
                />
              </div>
            </div>
            <Link to={"/"} className="chanel_details_videoPage">
              <b className="chanel_logo_videoPage">
                <p>{vv?.uploader?.charAt(0).toUpperCase()}</p>
              </b>
              <p className="chanel_name_videoPage">
                {vv?.videochanel || "Default channel"}
              </p>
            </Link>
            <div className="comments_VideoPage">
              <h2>
                <u>Comments</u>
              </h2>
              <Comment videoid={vv._id} />
            </div>
          </div>
        </div>
        <div className="moreVideoBar">More videos</div>
      </div>
    </div>
  );
};

export default Videopage;
