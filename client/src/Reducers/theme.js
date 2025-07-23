export const theme_reducer = (state = { theme: "dark" }, actions) => {
  switch (actions.type) {
    case "CHANGE":
      return { ...state, theme: state.theme === "light" ? "dark" : "light" };
    default:
      return state;
  }
};
