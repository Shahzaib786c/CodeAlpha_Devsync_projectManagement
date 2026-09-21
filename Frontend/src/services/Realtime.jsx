import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { api } from "./api";
import { signedOut } from "../app/authSlice";
const Context = createContext(null);
export function RealtimeProvider({ children }) {
  const { token, user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const [status, setStatus] = useState("connecting");
  const socketRef = useRef(null);
  const projectRef = useRef(null);
  useEffect(() => {
    if (!token) return;
    const socket = io(
      import.meta.env.VITE_SOCKET_URL || window.location.origin,
      {
        auth: { token },
        autoConnect: false,
        transports: ["websocket"],
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
      },
    );
    socketRef.current = socket;
    const connectTimer = setTimeout(() => socket.connect(), 0);
    let timer;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(
        () => dispatch(api.util.invalidateTags(["Workspace"])),
        160,
      );
    };
    const join = () => {
      if (projectRef.current)
        socket.emit(
          "project:join",
          { projectId: projectRef.current },
          (reply) => {
            if (!reply.success) refresh();
          },
        );
    };
    socket.on("connect", () => {
      setStatus("connected");
      join();
      refresh();
    });
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect_error", () => setStatus("disconnected"));
    socket.io.on("reconnect_attempt", () => setStatus("connecting"));
    [
      "workspace:changed",
      "task:created",
      "task:updated",
      "task:deleted",
      "comment:created",
      "comment:updated",
      "comment:deleted",
      "member:added",
      "member:removed",
      "project:updated",
      "project:deleted",
      "notification:read",
      "user:updated",
    ].forEach((event) => socket.on(event, refresh));
    socket.on("notification:new", (notice) => {
      refresh();
      toast(notice.message, {
        id: notice._id,
        description: "Workspace update",
      });
    });
    socket.on("project:removed", () => {
      refresh();
      toast.info("Your access to a project has changed.");
    });
    socket.on("session:expired", () => {
      dispatch(signedOut());
      toast.info("Your session ended. Please sign in again.", {
        id: "session-ended",
      });
    });
    return () => {
      clearTimeout(timer);
      clearTimeout(connectTimer);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, dispatch, user?._id]);
  const subscribe = (projectId) => {
    const socket = socketRef.current;
    const old = projectRef.current;
    projectRef.current = projectId;
    if (socket?.connected) {
      if (old) socket.emit("project:leave", { projectId: old });
      if (projectId)
        socket.emit("project:join", { projectId }, (reply) => {
          if (!reply.success) dispatch(api.util.invalidateTags(["Workspace"]));
        });
    }
  };
  return (
    <Context.Provider value={{ status, subscribe }}>
      {children}
    </Context.Provider>
  );
}
export const useRealtime = () => useContext(Context);
export function useProjectRoom(id) {
  const realtime = useRealtime();
  const ref = useRef(realtime);
  ref.current = realtime;
  useEffect(() => {
    ref.current.subscribe(id);
    return () => ref.current.subscribe(null);
  }, [id]);
}
