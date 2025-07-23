const videoreducer = (state = { data: [] }, action) => {
  switch (action.type) {
    case "POST_VIDEO":
      return { ...state, data: [...state.data, action.payload] };

    case "POST_LIKE":
      console.log("Like action payload:", action.payload);
      return {
        ...state,
        data: state.data.map((video) =>
          video._id === action.payload._id
            ? { ...video, Like: action.payload.Like }
            : video
        ),
      };

    case "POST_VIEWS":
      return {
        ...state,
        data: state.data.map((video) =>
          video._id === action.payload._id
            ? { ...video, views: action.payload.views }
            : video
        ),
      };

    case "FETCH_ALL_VIDEOS":
      return { ...state, data: action.payload };

    default:
      return state;
  }
};
export default videoreducer;
