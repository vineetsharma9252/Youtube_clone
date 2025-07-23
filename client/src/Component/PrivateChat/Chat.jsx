import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import "./Chat.css";

const socket = io("https://private-chat-3.onrender.com");

export default function ChatRoom() {
  const { roomId } = useParams(); // comes from /chat/:roomId
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const username = localStorage.getItem("username") || "Anonymous";

  useEffect(() => {
    // Join the room when component mounts
    socket.emit("join_room", roomId);

    // Listen for messages from the server
    socket.on("receive_message", (data) => {
      setChat((prevChat) => [...prevChat, data]);
    });

    // Cleanup when component unmounts
    return () => {
      socket.off("receive_message");
      socket.emit("leave_room", roomId); // Optional
    };
  }, [roomId]);

  const sendMessage = () => {
    if (message.trim() === "") return;

    const messageData = {
      roomId,
      sender: username,
      message,
      time: new Date().toLocaleTimeString(),
    };

    // 👇 emit to server
    socket.emit("send_message", messageData);

    // 👇 don't add to own chat immediately; wait for echo from server
    setMessage(""); // clear input
  };

  return (
    <div className="chat-container">
      <h2>Room: {roomId}</h2>
      <div className="chat-box">
        {chat.map((msg, index) => (
          <div key={index} className="chat-message">
            <strong>{msg.sender}:</strong> {msg.message}
            <span
              style={{ fontSize: "0.8em", marginLeft: "10px", color: "gray" }}
            >
              {msg.time}
            </span>
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
