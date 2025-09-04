import React, { useCallback, useEffect } from "react";
import { useState } from "react";
import { useSocket } from "../../context/SocketProvider";
import { useNavigate } from "react-router-dom";
import "./VideoCall.css"; // Add CSS file

export default function VideoCall() {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");
  const navigate = useNavigate();
  const socket = useSocket();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      if (email && room) {
        socket.emit("room:join", { email, room });
      }
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      const { email, room } = data;
      console.log(`User with email ${email} joined room ${room}`);
      navigate(`/video-call-room/${room}`);
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <div className="video-call-lobby youtube-theme">
      <header className="youtube-header">
        <h1>Video Call Lobby</h1>
      </header>
      <div className="content">
        <form onSubmit={handleSubmitForm}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="room">Room Number</label>
            <input
              type="text"
              id="room"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Enter room number"
              required
            />
          </div>
          <button type="submit" className="youtube-button">
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
}