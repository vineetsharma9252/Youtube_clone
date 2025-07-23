import React, { useState } from "react";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import axios from "axios";
export default function Dashboard() {
  const navigate = useNavigate();

  const [createData, setCreateData] = useState({
    username: "",
    roomName: "",
  });

  const [joinData, setJoinData] = useState({
    username: "",
    roomId: "",
  });
  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get("https://private-chat-3.onrender.com/protected", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        console.log(""); // or whatever data you expect
      })
      .catch((err) => {
        console.error(err.response?.data?.error);
      });
  }, []);
  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8);
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateData({ ...createData, [name]: value });
  };

  const handleJoinChange = (e) => {
    const { name, value } = e.target;
    setJoinData({ ...joinData, [name]: value });
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const roomId = createData.roomName;
    // Save info to localStorage (optional)
    localStorage.setItem("username", createData.username);
    navigate(`/chat/${roomId}`);
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem("username", joinData.username);
    navigate(`/chat/${joinData.roomId}`);
  };

  return (
    <div className="dash-container">
      <div className="dash-inner-container">
        <div className="instruction-container">
          <h3>Instructions</h3>
          <p>
            Enter your username and a room name to create a new room. Or, join
            an existing room by entering its ID and your name. Start chatting
            privately in real time!
          </p>
        </div>

        <div className="room-container">
          <div className="create-room">
            <h4>Create Room</h4>
            <form className="inputs" onSubmit={handleCreateSubmit}>
              <input
                type="text"
                name="username"
                value={createData.username}
                onChange={handleCreateChange}
                placeholder="Your Name"
                required
              />
              <input
                type="text"
                name="roomName"
                value={createData.roomName}
                onChange={handleCreateChange}
                placeholder="Room Name"
                required
              />
              <button type="submit">Create</button>
            </form>
          </div>

          <div className="join-room">
            <h4>Join Room</h4>
            <form className="inputs" onSubmit={handleJoinSubmit}>
              <input
                type="text"
                name="username"
                value={joinData.username}
                onChange={handleJoinChange}
                placeholder="Your Name"
                required
              />
              <input
                type="text"
                name="roomId"
                value={joinData.roomId}
                onChange={handleJoinChange}
                placeholder="Room ID"
                required
              />
              <button type="submit">Join</button>
            </form>
          </div>
        </div>

        <div className="history-container">
          <div className="inner-history-container">
            <h2>History</h2>
            <ul>
              <li>Room-1 (Coming soon...)</li>
              <li>Room-2 (Coming soon...)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
