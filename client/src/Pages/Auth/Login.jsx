import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import "./Login.css";
import { useSelector } from "react-redux";

// Configure Axios
axios.defaults.headers.common = {
  ...axios.defaults.headers.common,
  "x-requested-with": undefined,
};

// Southern states latitude ranges (approximate)
const SOUTHERN_LATITUDE_RANGE = { min: 8.0, max: 20.0 };
// Major cities and their approximate coordinates for reference
const MAJOR_CITIES = {
  // Southern cities
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Bangalore: { lat: 12.9716, lng: 77.5946 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Kochi: { lat: 9.9312, lng: 76.2673 },
  Coimbatore: { lat: 11.0168, lng: 76.9558 },

  // Northern cities
  Delhi: { lat: 28.6139, lng: 77.209 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Jaipur: { lat: 26.9124, lng: 75.7873 },
  Lucknow: { lat: 26.8467, lng: 80.9462 },
};

export default function Login() {
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [showOtpSection, setShowOtpSection] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isSouthernState, setIsSouthernState] = useState(null);
  const navigate = useNavigate();
  const otpWidgetRef = useRef(null);
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false);
  const scriptLoadAttempted = useRef(false);
  const theme = useSelector((state) => state.theme_reducer.theme) || "light"; // Read-only theme

  useEffect(() => {
    // Try to get location from browser
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          console.log("User location:", position.coords);
          classifyStateByLatitude(position.coords.latitude);
        },
        (error) => {
          console.error("Geolocation error:", error.message);
          detectStateByIP();
        },
        {
          timeout: 10000,
          maximumAge: 300000,
          enableHighAccuracy: false,
        }
      );
    } else {
      setMessage("Geolocation not supported. Using IP-based detection.");
      detectStateByIP();
    }
  }, []);

  useEffect(() => {
    if (isSouthernState === true) {
      loadOTPWidget();
    }
  }, [isSouthernState]);

  const classifyStateByLatitude = (latitude) => {
    const isSouthern =
      latitude >= SOUTHERN_LATITUDE_RANGE.min &&
      latitude <= SOUTHERN_LATITUDE_RANGE.max;
    setIsSouthernState(isSouthern);
    setMessage(
      `Your location: ${latitude.toFixed(4)}°N, ${
        isSouthern ? "Southern" : "Northern"
      } region detected.`
    );
  };

  const detectStateByIP = async () => {
    try {
      const response = await axios.get("https://ipapi.co/json/", {
        timeout: 5000,
      });
      const { latitude, longitude, region } = response.data;
      console.log("IP-based location:", response.data);

      if (latitude && longitude) {
        setUserLocation({ latitude, longitude });
        classifyStateByLatitude(latitude);
      } else {
        const southernRegions = [
          "Tamil Nadu",
          "Kerala",
          "Karnataka",
          "Andhra Pradesh",
          "Telangana",
        ];
        const isSouthern = southernRegions.includes(region);
        setIsSouthernState(isSouthern);
        setMessage(
          `IP detected in ${region || "unknown region"}, ${
            isSouthern ? "Southern" : "Northern"
          } state.`
        );
      }
    } catch (error) {
      console.error("IP detection failed:", error);
      setIsSouthernState(false);
      setMessage("Location detection failed. Using email OTP (Northern flow).");
    }
  };

  const loadOTPWidget = () => {
    if (scriptLoadAttempted.current) return;
    scriptLoadAttempted.current = true;

    if (
      document.querySelector(
        'script[src="https://verify.msg91.com/otp-provider.js"]'
      )
    ) {
      setIsWidgetLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://verify.msg91.com/otp-provider.js";
    script.async = true;

    script.onload = () => {
      console.log("OTP script loaded successfully");
      setIsWidgetLoaded(true);
      if (window.initSendOTP) {
        try {
          const config = {
            widgetId: "35687963534b313034323038",
            tokenAuth: "466011ThC7VXYHyb68abe490P1",
            identifier: "",
            success: (data) => {
              console.log("Widget success data:", data);
              if (data && data.message) {
                handleVerifyOTPWithToken(data);
              } else {
                setMessage("No token received from widget");
              }
            },
            failure: (error) => {
              console.error("Widget failure:", error);
              setMessage(`Widget failed: ${error.message || "Unknown error"}`);
            },
          };
          window.initSendOTP(config);
          otpWidgetRef.current = document.getElementById("captcha-container");
        } catch (error) {
          console.error("Widget initialization error:", error);
          setMessage(`Error initializing widget: ${error.message}`);
        }
      }
    };

    script.onerror = () => {
      console.error("Failed to load OTP widget script");
      setMessage("Failed to load OTP service. Please check your connection.");
    };

    document.body.appendChild(script);
  };

  const handleSendOTP = (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (isSouthernState === null) {
      setMessage("Detecting your location...");
      setIsLoading(false);
      return;
    }

    if (isSouthernState) {
      if (!/^\+?91?\d{10}$/.test(contact)) {
        setMessage("Invalid mobile number format");
        setIsLoading(false);
        return;
      }

      if (isWidgetLoaded && window.sendOtp) {
        if (window.updateIdentifier) {
          window.updateIdentifier(contact.replace("+91", ""));
        }
        window.sendOtp(
          contact.replace("+91", ""),
          (data) => {
            setMessage("OTP sent to your mobile");
            setShowOtpSection(true);
            setIsLoading(false);
          },
          (error) => {
            setMessage(
              `Error sending OTP: ${error?.message || "Unknown error"}`
            );
            console.error("Send OTP failure:", error);
            setIsLoading(false);
          }
        );
      } else {
        setMessage("OTP service loading...");
        setIsLoading(false);
      }
    } else {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setMessage("Invalid email format");
        setIsLoading(false);
        return;
      }
      sendEmailOTP();
    }
  };

  const sendEmailOTP = async () => {
    try {
      const response = await axios.post(
        "https://youtube-clone-9.onrender.com/api/send-email-otp",
        { email },
        { headers: { "x-requested-with": undefined } }
      );
      if (response.data.success) {
        setMessage("OTP sent to your email");
        setShowOtpSection(true);
      } else {
        setMessage(response.data.message || "Failed to send email OTP");
      }
    } catch (error) {
      console.error("Error sending email OTP:", error);
      setMessage("Error sending email OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTPWithToken = async (token) => {
    setIsLoading(true);
    try {
      if (!token) {
        setMessage("No token provided for verification");
        return;
      }
      const response = await axios.post(
        "https://youtube-clone-9.onrender.com/api/verify-otp",
        {
          token,
          mobile: contact.replace("+91", ""),
        },
        { headers: { "x-requested-with": undefined } }
      );
      console.log("OTP verification response:", response.data);
      if (response.data.success) {
        setMessage("Login successful!");
        if (response.data.token) {
          localStorage.setItem("authToken", response.data.token);
        }
        navigate("/");
        window.location.reload();
      } else {
        setMessage(response.data.message || "Invalid OTP");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setMessage("Error verifying OTP with server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post(
        "https://youtube-clone-9.onrender.com/api/verify-email-otp",
        { email, otp },
        { headers: { "x-requested-with": undefined } }
      );
      if (response.data.success) {
        setMessage("Login successful!");
        if (response.data.token) {
          localStorage.setItem("authToken", response.data.token);
        }
        navigate("/");
        window.location.reload();
      } else {
        setMessage(response.data.message || "Invalid OTP");
      }
    } catch (error) {
      console.error("Error verifying email OTP:", error);
      setMessage("Error verifying email OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSuccess = async (credentialResponse) => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        "https://youtube-clone-9.onrender.com/api/oauth/callback",
        { credential: credentialResponse.credential },
        { headers: { "x-requested-with": undefined } }
      );
      if (response.data.success) {
        if (response.data.token) {
          localStorage.setItem("authToken", response.data.token);
        }
        navigate("/");
        window.location.reload();
      } else {
        setMessage(response.data.message || "OAuth login failed");
      }
    } catch (error) {
      console.error("OAuth error:", error);
      setMessage("OAuth login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthError = () => {
    setMessage("OAuth login failed");
  };

  const handleManualRegionSelect = (isSouthern) => {
    setIsSouthernState(isSouthern);
    setMessage(`You selected ${isSouthern ? "Southern" : "Northern"} region.`);
  };

  return (
    <GoogleOAuthProvider clientId="592064090413-0n140npcgb55qrrkuod5ukl3upkb5svo.apps.googleusercontent.com">
      <div className={`login-container youtube-theme ${theme}`}>
        <header className="youtube-header">
          <h1>Login</h1>
        </header>
        <div className="login-content">
          {isLoading && <div className="loading">Loading...</div>}

          {isSouthernState === null && (
            <div className="region-fallback">
              <p>Having trouble detecting your location?</p>
              <div className="region-buttons">
                <button onClick={() => handleManualRegionSelect(true)}>
                  I'm in Southern India
                </button>
                <button onClick={() => handleManualRegionSelect(false)}>
                  I'm in Northern India
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSendOTP}>
            <div className="form-group">
              {isSouthernState !== null && isSouthernState ? (
                <>
                  <label>Mobile Number (+91 followed by 10 digits)</label>
                  <input
                    type="tel"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="+919876543210"
                    required
                    disabled={isLoading}
                  />
                </>
              ) : (
                <>
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    required
                    disabled={isLoading}
                  />
                </>
              )}
            </div>
            <button
              type="submit"
              className="youtube-button"
              disabled={
                isLoading ||
                (isSouthernState && !isWidgetLoaded) ||
                isSouthernState === null ||
                (isSouthernState ? !contact : !email)
              }
            >
              {isSouthernState === null
                ? "Detecting location..."
                : isSouthernState
                ? isWidgetLoaded
                  ? "Send OTP"
                  : "Loading OTP Service..."
                : "Send Email OTP"}
            </button>
          </form>

          {showOtpSection && isSouthernState && (
            <div>
              <p>
                Please enter the OTP received on your mobile via the widget.
              </p>
              <div id="captcha-container" />
            </div>
          )}

          {showOtpSection && !isSouthernState && (
            <div>
              <form onSubmit={handleVerifyEmailOTP}>
                <div className="form-group">
                  <label>OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                    required
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  className="youtube-button"
                  disabled={isLoading}
                >
                  Verify OTP
                </button>
              </form>
            </div>
          )}

          <div className="oauth-section">
            <p>Or login with Google</p>
            <GoogleLogin
              onSuccess={handleOAuthSuccess}
              onError={handleOAuthError}
              disabled={isLoading || isSouthernState === null} // Removed !isSouthernState condition
            />
          </div>

          {message && (
            <div
              className={`message ${
                message.includes("successful") ? "success" : "error"
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
