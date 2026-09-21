import { createSlice } from "@reduxjs/toolkit";
let saved = null;
try {
  saved = JSON.parse(sessionStorage.getItem("devsync.session"));
} catch {
  /* A restricted browser can still use an in-memory session. */
}
const auth = createSlice({
  name: "auth",
  initialState: { token: saved?.token || null, user: saved?.user || null },
  reducers: {
    signedIn: (state, { payload }) => {
      state.token = payload.token;
      state.user = payload.user;
    },
    userUpdated: (state, { payload }) => {
      state.user = payload;
    },
    signedOut: (state) => {
      state.token = null;
      state.user = null;
    },
  },
});
export const { signedIn, signedOut, userUpdated } = auth.actions;
export default auth.reducer;
