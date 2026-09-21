import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import auth, { signedIn, signedOut, userUpdated } from "./authSlice";
import { api } from "../services/api";
const listener = createListenerMiddleware();
listener.startListening({
  predicate: (action) =>
    [signedIn.type, signedOut.type, userUpdated.type].includes(action.type),
  effect: (action, context) => {
    try {
      const auth = context.getState().auth;
      if (auth.token)
        sessionStorage.setItem("devsync.session", JSON.stringify(auth));
      else sessionStorage.removeItem("devsync.session");
    } catch {
      /* Session remains usable until reload. */
    }
    if (action.type === signedOut.type)
      context.dispatch(api.util.resetApiState());
  },
});
export const store = configureStore({
  reducer: { auth, [api.reducerPath]: api.reducer },
  middleware: (get) =>
    get().prepend(listener.middleware).concat(api.middleware),
});
setupListeners(store.dispatch);
