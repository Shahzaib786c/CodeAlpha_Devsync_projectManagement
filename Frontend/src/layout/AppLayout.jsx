import { useEffect, useState } from "react";
import { NavLink, Link, Outlet, useLocation, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Users,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  Brand,
  Avatar,
  IconButton,
  Loading,
  ErrorState,
  Confirm,
} from "../components/ui";
import { useReadQuery, useWriteMutation, errorMessage } from "../services/api";
import { userUpdated, signedOut } from "../app/authSlice";
import { RealtimeProvider, useRealtime } from "../services/Realtime";
const links = [
  ["/", "Overview", LayoutDashboard],
  ["/projects", "Projects", FolderKanban],
  ["/tasks", "My tasks", ListTodo],
  ["/team", "Team", Users],
  ["/notifications", "Notifications", Bell],
];
export default function AppLayout() {
  const token = useSelector((s) => s.auth.token);
  const me = useReadQuery("/auth/me", { skip: !token });
  const dispatch = useDispatch();
  useEffect(() => {
    if (me.data) dispatch(userUpdated(me.data.data));
  }, [me.data, dispatch]);
  if (!token) return <Navigate to="/login" replace />;
  if (me.isLoading)
    return (
      <div className="full-screen">
        <Brand />
        <Loading />
      </div>
    );
  if (me.error)
    return (
      <div className="full-screen">
        <Brand />
        <ErrorState error={me.error} retry={me.refetch} />
        <button className="text-button" onClick={() => dispatch(signedOut())}>
          Return to sign in
        </button>
      </div>
    );
  return (
    <RealtimeProvider>
      <Shell />
    </RealtimeProvider>
  );
}
function Shell() {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const location = useLocation();
  const [mobile, setMobile] = useState(false);
  const [signout, setSignout] = useState(false);
  const projects = useReadQuery("/projects?limit=3");
  const notifications = useReadQuery("/notifications?limit=1");
  const [write, { isLoading }] = useWriteMutation();
  const { status } = useRealtime();
  useEffect(() => {
    setMobile(false);
    document.getElementById("main-content")?.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    if (!mobile) return;
    const key = (e) => {
      if (e.key === "Escape") setMobile(false);
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [mobile]);
  const active = links.find(([path]) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path),
  );
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {mobile && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        className={`sidebar ${mobile ? "is-open" : ""}`}
        aria-label="Main navigation"
      >
        <div className="sidebar-brand">
          <Brand />
          <button
            className="icon-btn mobile-close"
            aria-label="Close navigation"
            onClick={() => setMobile(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-label">
          <span className="workspace-icon">D</span>
          <div>
            <strong>My workspace</strong>
            <small>Personal & shared projects</small>
          </div>
        </div>
        <p className="nav-section">WORKSPACE</p>
        <nav>
          {links.map(([path, label, Icon]) => (
            <NavLink
              to={path}
              end={path === "/"}
              key={path}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} />
              <span>{label}</span>
              {label === "Notifications" && notifications.data?.unread > 0 && (
                <span className="nav-count">
                  {notifications.data.unread > 99
                    ? "99+"
                    : notifications.data.unread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-projects">
          <div className="nav-section">
            <span>RECENT PROJECTS</span>
            <Link to="/projects" aria-label="View projects">
              <Plus size={15} />
            </Link>
          </div>
          {projects.data?.data.map((p, i) => (
            <Link
              key={p._id}
              to={`/projects/${p._id}`}
              className="sidebar-project"
            >
              <i className={`project-dot dot-${i}`} />
              <span>{p.name}</span>
            </Link>
          ))}
          {!projects.data?.data.length && (
            <p className="sidebar-hint">Your projects will appear here.</p>
          )}
        </div>
        <div className="sidebar-bottom">
          <NavLink
            to="/profile"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <Settings size={19} />
            Profile & settings
          </NavLink>
          <div className="account">
            <Link to="/profile">
              <Avatar user={user} size="md" />
              <div>
                <strong>{user.name}</strong>
                <small>My account</small>
              </div>
            </Link>
            <IconButton label="Sign out" onClick={() => setSignout(true)}>
              <LogOut size={17} />
            </IconButton>
          </div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-btn menu-toggle"
              aria-label="Open navigation"
              aria-expanded={mobile}
              onClick={() => setMobile(true)}
            >
              <Menu size={21} />
            </button>
            <span className="breadcrumb-root">Workspace</span>
            <ChevronRight size={14} />
            <strong>{active?.[1] || "Profile & settings"}</strong>
          </div>
          <div className="topbar-right">
            <span
              className={`connection ${status}`}
              title={
                status === "connected"
                  ? "Live updates are connected"
                  : "Changes may be delayed. Reconnecting automatically."
              }
            >
              <i />
              {status === "connected"
                ? "Live updates"
                : status === "connecting"
                  ? "Connecting…"
                  : "Reconnecting…"}
            </span>
            <Link
              className="notification-bell"
              to="/notifications"
              aria-label="View notifications"
            >
              <Bell size={19} />
              {notifications.data?.unread > 0 && <i />}
            </Link>
            <Link to="/profile" aria-label="Your profile">
              <Avatar user={user} />
            </Link>
          </div>
        </header>
        {status === "disconnected" && (
          <div className="connection-banner" role="status">
            Live updates are reconnecting. You can keep working; the latest
            changes will reload when the connection returns.
          </div>
        )}
        <main id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>DevSync</span>
          <span>Your work, in sync.</span>
        </footer>
      </div>
      {signout && (
        <Confirm
          title="Sign out of DevSync?"
          description="This signs you out of all active sessions for this account."
          onClose={() => setSignout(false)}
          loading={isLoading}
          onConfirm={async () => {
            try {
              await write({ url: "/auth/logout" }).unwrap();
              dispatch(signedOut());
            } catch (e) {
              toast.error(errorMessage(e));
            }
          }}
        />
      )}
    </div>
  );
}
