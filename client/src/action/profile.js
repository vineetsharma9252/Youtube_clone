import axios from "axios";

export const getUserProfile = (email) => async (dispatch) => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(
      `https://youtube-clone-9.onrender.com/api/user/profile/${email}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    dispatch({ type: "SET_PROFILE", payload: response.data });
  } catch (error) {
    console.error("Profile fetch error:", error);
  }
};
