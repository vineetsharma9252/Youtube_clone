import React, { useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

const Displaycommment = ({
  cid,
  userid,
  commentbody,
  commenton,
  usercommented,
  videoid,
}) => {
  const currentuser = useSelector((state) => state.currentuserreducer);
  const [targetLang, setTargetLang] = useState("es");
  const [translatedText, setTranslatedText] = useState("");
  const [showTranslate, setShowTranslate] = useState(false);
  const [error, setError] = useState("");

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "hi", name: "Hindi" },
    { code: "zh", name: "Chinese" },
  ];

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

  return (
    <div className="comment-item">
      <div className="comment-header">
        <span className="comment-user">
          {usercommented} {"  "}
        </span>
        <span className="comment-date">{new Date().toLocaleDateString()}</span>
      </div>
      <p className="comment-body">{commentbody}</p>
      {currentuser && (
        <div className="translate-controls">
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="translate-select"
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
          >
            Translate
          </button>
        </div>
      )}
      {error && <p className="translate-error">{error}</p>}
      {showTranslate && translatedText && (
        <p className="translated-comment">Translated: {translatedText}</p>
      )}
    </div>
  );
};

export default Displaycommment;
