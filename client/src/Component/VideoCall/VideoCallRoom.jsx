import React, { useCallback, useEffect, useState, useRef } from "react";
import { useSocket } from "../../context/SocketProvider";
import peer from "../../service/peer";
import { useNavigate } from "react-router-dom";
import "./VideoCall.css";

export default function VideoCallRoom() {
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState("Connecting...");
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const socket = useSocket();
  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const recorderRef = useRef(null);
  const recordedChunks = useRef([]);
  const navigate = useNavigate();

  const sendStreams = useCallback(() => {
    if (myStream && peer.peer) {
      for (const track of myStream.getTracks()) {
        peer.peer.addTrack(track, myStream);
      }
    }
  }, [myStream]);

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`User with email ${email} and id ${id} joined the room`);
    setRemoteSocketId(id);
    setCallStatus("User joined. Ready to call.");
  }, []);

  const handleCallUser = useCallback(async () => {
    try {
      setCallStatus("Calling...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      if (myVideoRef.current) myVideoRef.current.srcObject = stream;
      const offer = await peer.getOffer();
      socket.emit("user:call", { to: remoteSocketId, offer });
      sendStreams();
      setCallStatus("Calling... Waiting for acceptance");
    } catch (error) {
      console.error("Error in handleCallUser:", error);
      setCallStatus("Call failed");
    }
  }, [remoteSocketId, socket, sendStreams]);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      try {
        setCallStatus("Incoming call...");
        setRemoteSocketId(from);
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        setMyStream(stream);
        if (myVideoRef.current) myVideoRef.current.srcObject = stream;
        const ans = await peer.getAnswer(offer);
        socket.emit("call:accepted", { to: from, ans });
        sendStreams();
        setCallStatus("Call accepted");
      } catch (error) {
        console.error("Error in handleIncommingCall:", error);
        setCallStatus("Call failed");
      }
    },
    [socket, sendStreams]
  );

  const handleCallAccepted = useCallback(
    async ({ from, ans }) => {
      try {
        await peer.setLocalDescription(ans);
        console.log("Call accepted by", from);
        setCallStatus("Call in progress");
      } catch (error) {
        console.error("Error in handleCallAccepted:", error);
        setCallStatus("Call failed");
      }
    },
    []
  );

  const handleNegoNeeded = useCallback(async () => {
    try {
      const offer = await peer.getOffer();
      socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
    } catch (error) {
      console.error("Error in handleNegoNeeded:", error);
    }
  }, [remoteSocketId, socket]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      try {
        const ans = await peer.getAnswer(offer);
        socket.emit("peer:nego:done", { to: from, ans });
        sendStreams();
      } catch (error) {
        console.error("Error in handleNegoNeedIncomming:", error);
      }
    },
    [socket, sendStreams]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    try {
      await peer.setLocalDescription(ans);
    } catch (error) {
      console.error("Error in handleNegoNeedFinal:", error);
    }
  }, []);

  const toggleAudioMute = useCallback(() => {
    if (myStream) {
      myStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setIsAudioMuted(!track.enabled);
      });
    }
  }, [myStream]);

  const toggleVideoMute = useCallback(() => {
    if (myStream) {
      myStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setIsVideoMuted(!track.enabled);
      });
    }
  }, [myStream]);

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false, // Optional: Share audio
      });
      setIsSharingScreen(true);
      // Replace video track with screen share track
      const videoTrack = screenStream.getVideoTracks()[0];
      const sender = peer.peer.getSenders().find((s) => s.track.kind === videoTrack.kind);
      sender.replaceTrack(videoTrack);
    } catch (error) {
      console.error("Screen share error:", error);
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    if (myStream) {
      const videoTrack = myStream.getVideoTracks()[0];
      const sender = peer.peer.getSenders().find((s) => s.track.kind === videoTrack.kind);
      sender.replaceTrack(myStream.getVideoTracks()[0]);
      setIsSharingScreen(false);
    }
  }, [myStream]);

  const startRecording = useCallback(() => {
    if (myStream && remoteStream) {
      const mediaRecorder = new MediaRecorder(remoteStream);
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: "video/mp4" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "video-session.mp4";
        a.click();
        URL.revokeObjectURL(url);
        recordedChunks.current = [];
      };
      mediaRecorder.start();
      recorderRef.current = mediaRecorder;
      setIsRecording(true);
    }
  }, [myStream, remoteStream]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const endCall = useCallback(() => {
    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop());
      setMyStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
      setRemoteStream(null);
    }
    setRemoteSocketId(null);
    setCallStatus("Call ended");
    socket.emit("call:ended", { to: remoteSocketId });
    navigate("/video-call"); // Back to lobby
  }, [myStream, remoteStream, remoteSocketId, socket, navigate]);

  useEffect(() => {
    peer.peer.addEventListener("track", (ev) => {
      const [stream] = ev.streams;
      console.log("Received remote stream");
      setRemoteStream(stream);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
    });
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);

    return () => {
      peer.peer.removeEventListener("track", (ev) => {
        const [stream] = ev.streams;
        setRemoteStream(stream);
      });
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);
    socket.on("call:ended", () => {
      endCall();
    });

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
      socket.off("call:ended", endCall);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
    endCall,
  ]);

  useEffect(() => {
    return () => {
      if (myStream) {
        myStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [myStream]);

  return (
    <div className="video-call-room youtube-theme">
      <header className="youtube-header">
        <h1>Video Call Room</h1>
        <span>{callStatus}</span>
      </header>
      <div className="video-container">
        <div className="video-section">
          <h2>My Video</h2>
          <video
            playsInline
            muted
            autoPlay
            ref={myVideoRef}
            style={{ width: "100%", maxWidth: "640px", backgroundColor: "black" }}
          />
        </div>
        <div className="video-section">
          <h2>Remote Video</h2>
          <video
            playsInline
            autoPlay
            ref={remoteVideoRef}
            style={{ width: "100%", maxWidth: "640px", backgroundColor: "black" }}
          />
        </div>
      </div>
      <div className="controls">
        {remoteSocketId && !myStream && (
          <button onClick={handleCallUser} className="youtube-button">
            Start Call
          </button>
        )}
        {myStream && (
          <>
            <button
              onClick={toggleAudioMute}
              className="youtube-button"
              style={{ backgroundColor: isAudioMuted ? "#ccc" : "#ff0000" }}
            >
              {isAudioMuted ? "Unmute Audio" : "Mute Audio"}
            </button>
            <button
              onClick={toggleVideoMute}
              className="youtube-button"
              style={{ backgroundColor: isVideoMuted ? "#ccc" : "#ff0000" }}
            >
              {isVideoMuted ? "Unmute Video" : "Mute Video"}
            </button>
            <button
              onClick={isSharingScreen ? stopScreenShare : startScreenShare}
              className="youtube-button"
              style={{ backgroundColor: isSharingScreen ? "#ccc" : "#3ea6ff" }}
            >
              {isSharingScreen ? "Stop Sharing Screen" : "Share Screen"}
            </button>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className="youtube-button"
              style={{ backgroundColor: isRecording ? "#ccc" : "#ff0000" }}
            >
              {isRecording ? "Stop Recording" : "Start Recording"}
            </button>
            <button onClick={endCall} className="youtube-button" style={{ backgroundColor: "#cc0000" }}>
              End Call
            </button>
          </>
        )}
      </div>
    </div>
  );
}