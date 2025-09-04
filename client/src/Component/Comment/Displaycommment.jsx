import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { AiOutlineClose } from "react-icons/ai";
import { AiOutlineLike } from "react-icons/ai";
import { AiFillLike } from "react-icons/ai";
import { AiOutlineDislike } from "react-icons/ai";
import { AiFillDislike } from "react-icons/ai";

const Displaycommment = ({
  cid,
  userid,
  commentbody,
  commenton,
  usercommented,
  videoid,
  onDelete, // Callback to notify parent component of deletion
}) => {
  const currentuser = useSelector((state) => state.currentuserreducer);
  const [targetLang, setTargetLang] = useState("es");
  const [translatedText, setTranslatedText] = useState("");
  const [showTranslate, setShowTranslate] = useState(false);
  const [error, setError] = useState("");
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userAction, setUserAction] = useState(null); // 'like', 'dislike', or null

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "hi", name: "Hindi" },
    { code: "zh", name: "Chinese" },
  ];

  useEffect(() => {
    const fetchCommentReactions = async () => {
      if (currentuser && cid) {
        try {
          const response = await axios.get(
            `http://localhost:5000/comment/${cid}/reactions`,
            {
              headers: { Authorization: `Bearer ${currentuser.token}` },
            }
          );
          setLikes(response.data.likes || 0);
          setDislikes(response.data.dislikes || 0);
          // Assume userAction is not returned; handle it via separate API if needed
        } catch (err) {
          console.error("Failed to fetch reactions:", err.message);
        }
      }
    };
    fetchCommentReactions();
  }, [currentuser, cid]);

  useEffect(() => {
    // Auto-delete if dislikes reach 2 or more
    if (dislikes >= 2) {
      handleDeleteComment();
    }
  }, [dislikes]);

  const handleCommentHiding = () => {
    setShowTranslate(false);
    setTranslatedText("");
    setError("");
  };

  const handleTranslate = async () => {
    if (!currentuser) {
      setError("Please sign in to translate");
      return;
    }
    try {
      const response = await axios.post(
        "http://localhost:5000/translate",
        { text: commentbody, sourceLang: "en", targetLang },
        { headers: { Authorization: `Bearer ${currentuser.token}` } }
      );
      setTranslatedText(response.data.translatedText);
      setShowTranslate(true);
      setError("");
    } catch (err) {
      console.error(
        "Translation error:",
        err.response?.data?.error || err.message
      );
      setError(err.response?.data?.error || "Translation failed");
      setTranslatedText("");
    }
  };

  const handleLike = async () => {
    if (!currentuser) {
      setError("Please sign in to like");
      return;
    }
    try {
      const response = await axios.post(
        `http://localhost:5000/comment/${cid}/like`,
        {},
        { headers: { Authorization: `Bearer ${currentuser.token}` } }
      );
      console.log("Like response:", response.data);
      setLikes(response.data.likes);
      setDislikes(response.data.dislikes);
      setUserAction(userAction === "like" ? null : "like");
      setError("");
    } catch (err) {
      console.error("Like error:", err.response?.data?.error || err.message);
      setError("Failed to like comment");
    }
  };

  const handleDislike = async () => {
    if (!currentuser) {
      setError("Please sign in to dislike");
      return;
    }
    try {
      const response = await axios.post(
        `http://localhost:5000/comment/${cid}/dislike`,
        {},
        { headers: { Authorization: `Bearer ${currentuser.token}` } }
      );
      console.log("Dislike response:", response.data);
      setLikes(response.data.likes);
      setDislikes(response.data.dislikes);
      setUserAction(userAction === "dislike" ? null : "dislike");
      setError("");
    } catch (err) {
      console.error("Dislike error:", err.response?.data?.error || err.message);
      setError("Failed to dislike comment");
    }
  };

  const handleDeleteComment = async () => {
    try {
      await axios.delete(`http://localhost:5000/comment/${cid}`, {
        headers: { Authorization: `Bearer ${currentuser.token}` },
      });
      if (onDelete) onDelete(cid); // Notify parent to remove the comment
    } catch (err) {
      console.error("Delete error:", err.response?.data?.error || err.message);
      setError("Failed to delete comment");
    }
  };

  return (
    <div className="comment-item">
      <div className="comment-header">
        <span className="comment-user">{usercommented} {"  "}</span>
        <span className="comment-date">{new Date().toLocaleDateString()}</span>
      </div>
      <p className="comment-body">{commentbody}</p>
      {currentuser && (
        <div className="translate-controls">
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="translate-select"
            style={{
              background: "none",
              color: "white",
              border: "none",
            }}
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
          <button
            className="translate-button"
            onClick={handleTranslate}
            disabled={!commentbody}
            style={{
              background: "none",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: "16px",
              marginLeft: "10px",
            }}
          >
            Translate
          </button>
        </div>
      )}
      {error && <p className="translate-error">{error}</p>}
      {showTranslate && translatedText && (
        <p className="translated-comment">Translated: {translatedText}</p>
      )}
      {translatedText && (
        <button
          onClick={handleCommentHiding}
          style={{
            background: "none",
            position: "absolute",
            border: "none",
            cursor: "pointer",
            fontSize: "16px",
            marginLeft: "300px",
            marginBottom: "50px",
            color: "#555",
          }}
        >
          <AiOutlineClose />
        </button>
      )}
      <div className="like-dislike-container">
        <button
          className="like-button"
          onClick={handleLike}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "20px",
            color: userAction === "like" ? "#3b82f6" : "#555",
          }}
        >
          {userAction === "like" ? <AiFillLike /> : <AiOutlineLike />}
          <span style={{ marginLeft: "5px" }}>{likes}</span>
        </button>
        <button
          className="dislike-button"
          onClick={handleDislike}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "20px",
            color: userAction === "dislike" ? "#ef4444" : "#555",
          }}
        >
          {userAction === "dislike" ? <AiFillDislike /> : <AiOutlineDislike />}
          <span style={{ marginLeft: "5px" }}>{dislikes}</span>
        </button>
      </div>
    </div>
  );
};

export default Displaycommment;