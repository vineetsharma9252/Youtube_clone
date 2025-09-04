const likedvideoreducer = (state = { data: [] }, action) => {
  switch (action.type) {
    case "POST_LIKEDVIDEO":
      return { ...state, data: Array.isArray(action?.data) ? action.data : [action?.data || {}] };
    case "FETCH_ALL_LIKED_VIDEOS":
      return { ...state, data: Array.isArray(action?.payload) ? action.payload : typeof action?.payload === "string" ? JSON.parse(action.payload || "[]") : [] };
    case "DELETE_LIKEDVIDEO":
      return {
        ...state,
        data: state.data.filter((item) => !(item.videoid === action.payload.videoid && item.viewer === action.payload.viewer)),
      };
    default:
      return state;
  }
};
export default likedvideoreducer;