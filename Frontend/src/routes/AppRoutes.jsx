import { lazy, Suspense } from "react";
import { Routes, Route, Link, useParams } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import Auth from "../pages/Auth";
import { Loading, Page, Empty } from "../components/ui";
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Projects = lazy(() => import("../pages/Projects"));
const ProjectDetail = lazy(() => import("../pages/ProjectDetail"));
const MyTasks = lazy(() => import("../pages/MyTasks"));
const Team = lazy(() => import("../pages/Team"));
const Notifications = lazy(() => import("../pages/Notifications"));
const Profile = lazy(() => import("../pages/Profile"));
export default function AppRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<Auth key="login" />} />
        <Route path="/register" element={<Auth key="register" register />} />
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId" element={<ProjectRoute />} />
          <Route path="/tasks" element={<MyTasks />} />
          <Route path="/team" element={<Team />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route
            path="*"
            element={
              <Page>
                <Empty
                  title="This page wandered off"
                  description="The link may have changed. Your workspace is still here."
                  action={
                    <Link className="btn btn-primary" to="/">
                      Back to overview
                    </Link>
                  }
                />
              </Page>
            }
          />
        </Route>
      </Routes>
    </Suspense>
  );
}

function ProjectRoute() {
  const { projectId } = useParams();
  return <ProjectDetail key={projectId} />;
}
