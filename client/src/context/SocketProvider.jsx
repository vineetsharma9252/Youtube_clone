import React, { createContext, useCallback, useContext } from "react";
import { io, Socket } from "socket.io-client";
import { useMemo } from "react";
const SocketContext = createContext(null);

export const useSocket = () => {
  const socket = useContext(SocketContext);
  return socket;
};

const SocketProvider = ({ children }) => {
  const socket = useMemo(() => io("http://localhost:8000"), []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export default SocketProvider;
