import axios from "axios";

export const getUserProfile = (email) => async (dispatch) => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(`http://localhost:5000/api/user/profile/${email}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    dispatch({ type: "SET_PROFILE", payload: response.data });
  } catch (error) {
    console.error("Profile fetch error:", error);
  }
};