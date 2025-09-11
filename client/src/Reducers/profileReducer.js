const initialState = {
  downloadedVideos: [],
};

const profileReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SET_PROFILE":
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

export default profileReducer;