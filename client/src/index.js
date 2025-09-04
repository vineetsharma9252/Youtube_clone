import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import SocketProvider from "./context/SocketProvider.jsx";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { Provider } from "react-redux";
import { applyMiddleware, compose } from "redux";
import { legacy_createStore as createstore } from "redux";
import { thunk } from "redux-thunk";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Reducers from "./Reducers";
const store = createstore(Reducers, compose(applyMiddleware(thunk)));
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <GoogleOAuthProvider
      clientId="592064090413-0n140npcgb55qrrkuod5ukl3upkb5svo.apps.googleusercontent.com"
      domain={window.location.hostname}
    >
      <React.StrictMode>
        <SocketProvider>
        <App />
        </SocketProvider>
      </React.StrictMode>
    </GoogleOAuthProvider>
  </Provider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
