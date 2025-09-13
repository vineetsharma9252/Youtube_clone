import React, { useEffect, useState } from "react";
import { BsThreeDots } from "react-icons/bs";
import {
  AiFillDislike,
  AiFillLike,
  AiOutlineDislike,
  AiOutlineLike,
} from "react-icons/ai";
import { MdPlaylistAddCheck } from "react-icons/md";
import {
  RiHeartAddFill,
  RiPlayListAddFill,
  RiShareForwardLine,
} from "react-icons/ri";
import { IoMdDownload } from "react-icons/io";
import "./Likewatchlatersavebtn.css";
import { useSelector, useDispatch } from "react-redux";
import { likevideo } from "../../action/video";
import { addtolikedvideo, deletelikedvideo } from "../../action/likedvideo";
import { addtowatchlater, deletewatchlater } from "../../action/watchlater";

const Likewatchlatersavebtns = ({ vv, vid, currentuser }) => {
  const dispatch = useDispatch();
  const [savevideo, setsavevideo] = useState(false);
  const [dislikebtn, setdislikebtn] = useState(false);
  const [likebtn, setlikebtn] = useState(false);

  const likedvideolist = useSelector((state) => state.likedvideoreducer);
  const watchlaterlist = useSelector((state) => state.watchlaterreducer);

  useEffect(() => {
    const userId = currentuser?.email;
    if (!userId) return;

    console.log("current user in the liked function is :", currentuser);
    console.log("liked video is : ", likedvideolist);
    console.log("watch later list ", watchlaterlist);

    const liked = likedvideolist?.data?.some(
      (q) => q.videoid === vid && q.viewer === userId
    );
    setlikebtn(!!liked);

    const saved = watchlaterlist?.data?.some(
      (q) => q.videoid === vid && q.viewer === userId
    );
    setsavevideo(!!saved);
  }, [currentuser, likedvideolist, watchlaterlist, vid]);

  const togglesavedvideo = () => {
    const userId = currentuser?.email;
    if (!userId) {
      alert("Please login to save video");
      return;
    }

    if (savevideo) {
      setsavevideo(false);
      dispatch(deletewatchlater({ videoid: vid, viewer: userId }));
    } else {
      setsavevideo(true);
      dispatch(addtowatchlater({ videoid: vid, viewer: userId }));
    }
  };

  const togglelikevideo = (e, lk) => {
    const userId = currentuser?.email;
    if (!userId) {
      alert("Please login to like video");
      return;
    }

    if (likebtn) {
      setlikebtn(false);
      dispatch(likevideo({ id: vid, Like: lk - 1 }));
      dispatch(deletelikedvideo({ videoid: vid, viewer: userId }));
    } else {
      setlikebtn(true);
      dispatch(likevideo({ id: vid, Like: lk + 1 }));
      dispatch(addtolikedvideo({ videoid: vid, viewer: userId }));
      setdislikebtn(false);
    }
  };

  const toggledislikevideo = () => {
    const userId = currentuser?.email;
    if (!userId) {
      alert("Please login to dislike video");
      return;
    }

    if (dislikebtn) {
      setdislikebtn(false);
    } else {
      setdislikebtn(true);
      if (likebtn) {
        dispatch(likevideo({ id: vid, Like: vv.Like - 1 }));
        dispatch(deletelikedvideo({ videoid: vid, viewer: userId }));
        setlikebtn(false);
      }
    }
  };

  const handleDownload = async () => {
    if (!currentuser) {
      alert("Please login to download");
      return;
    }

    console.log("Initiating download for video ID:", vid);
    console.log("Current user:", currentuser);

    try {
      const response = await fetch(
        `https://youtube-clone-9.onrender.com/video/download/${vid}`, // Changed to GET
        {
          method: "POST", // Corrected to GET for file download
          headers: {
            Authorization: `Bearer ${currentuser.token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Download failed: ${errorText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${vv.title}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      alert("Download started!");
    } catch (error) {
      console.error("Download error:", error.message);
      alert("Download failed: " + error.message);
    }
  };

  return (
    <div className="btns_cont_videoPage">
      <div className="btn_VideoPage">
        <BsThreeDots />
      </div>
      <div className="btn_VideoPage">
        <div
          className="like_videoPage"
          onClick={(e) => togglelikevideo(e, vv.Like)}
        >
          {likebtn ? (
            <AiFillLike size={22} className="btns_videoPage" />
          ) : (
            <AiOutlineLike size={22} className="btns_videoPage" />
          )}
          <b>{vv.Like}</b>
        </div>
        <div className="like_videoPage" onClick={toggledislikevideo}>
          {dislikebtn ? (
            <AiFillDislike size={22} className="btns_videoPage" />
          ) : (
            <AiOutlineDislike size={22} className="btns_videoPage" />
          )}
          <b>DISLIKE</b>
        </div>
        <div className="like_videoPage" onClick={togglesavedvideo}>
          {savevideo ? (
            <>
              <MdPlaylistAddCheck size={22} className="btns_videoPage" />
              <b>Saved</b>
            </>
          ) : (
            <>
              <RiPlayListAddFill size={22} className="btns_videoPage" />
              <b>Save</b>
            </>
          )}
        </div>
        <div className="like_videoPage">
          <RiHeartAddFill size={22} className="btns_videoPage" />
          <b>Thanks</b>
        </div>
        <div className="like_videoPage">
          <RiShareForwardLine size={22} className="btns_videoPage" />
          <b>Share</b>
        </div>
        {currentuser && (
          <div
            className={`like_videoPage ${
              currentuser.subscriptionTier !== "Gold" ? "disabled" : ""
            }`}
            onClick={handleDownload}
          >
            <IoMdDownload size={22} className="btns_videoPage" />
            <b>Download</b>
          </div>
        )}
      </div>
    </div>
  );
};

export default Likewatchlatersavebtns;
