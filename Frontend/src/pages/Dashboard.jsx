import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Plus,
  ArrowUpRight,
  FolderKanban,
  Clock3,
  CheckCircle2,
  ArrowRight,
  ListTodo,
  Bell,
} from "lucide-react";
import {
  Page,
  PageHeader,
  Button,
  Loading,
  ErrorState,
  Empty,
  ProjectCard,
  TaskRow,
} from "../components/ui";
import { useReadQuery } from "../services/api";
import ProjectForm from "../components/ProjectForm";
import TaskDialog from "../components/TaskDialog";
import { dateLabel } from "../utils/format";
export default function Dashboard() {
  const user = useSelector((s) => s.auth.user);
  const navigate = useNavigate();
  const [create, setCreate] = useState(false);
  const [task, setTask] = useState(null);
  const overview = useReadQuery("/overview");
  const projects = useReadQuery("/projects?limit=3");
  const tasks = useReadQuery("/tasks/mine?limit=5");
  const notifications = useReadQuery("/notifications?limit=4");
  const counts = overview.data?.data;
  const total = counts
    ? counts.pending + counts.inProgress + counts.completed
    : 0;
  const progress = total ? Math.round((counts.completed / total) * 100) : 0;
  return (
    <Page>
      <PageHeader
        eyebrow={new Date().toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
        title={`Hello, ${user.name.split(" ")[0]}.`}
        description="Here’s where your work stands today."
        action={
          <Button onClick={() => setCreate(true)}>
            <Plus size={18} />
            New project
          </Button>
        }
      />
      <div className="dashboard-intro">
        <div>
          <span className="eyebrow">A CLEARER VIEW</span>
          <h2>
            Your workspace,
            <br />
            <em>at a glance.</em>
          </h2>
          <p>
            One place for your projects.
            <br />
            More room for your best work.
          </p>
          <Link to="/projects">
            Explore your projects <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="intro-progress">
          <div
            className="progress-ring"
            style={{ "--progress": `${progress}%` }}
          >
            <div>
              <strong>
                {progress}
                <span>%</span>
              </strong>
              <small>completed</small>
            </div>
          </div>
          <div className="progress-caption">
            <span className="tiny-dot" /> {counts?.completed || 0} of {total}{" "}
            tasks completed
          </div>
        </div>
        <div className="intro-note">
          <span>WORKSPACE SNAPSHOT</span>
          <strong>{counts?.assignedToMe ?? "—"}</strong>
          <p>
            tasks assigned
            <br />
            to you
          </p>
          <Link to="/tasks" aria-label="View your tasks">
            <ArrowUpRight size={23} />
          </Link>
        </div>
      </div>
      {overview.error ? (
        <ErrorState error={overview.error} retry={overview.refetch} />
      ) : (
        <div className="stats-grid">
          {[
            [
              FolderKanban,
              "Projects",
              counts?.projects,
              "All your shared spaces",
            ],
            [ListTodo, "To do", counts?.pending, "Ready when you are"],
            [Clock3, "In progress", counts?.inProgress, "Work moving forward"],
            [
              CheckCircle2,
              "Completed",
              counts?.completed,
              "Across your projects",
            ],
          ].map(([Icon, label, value, note], i) => (
            <div className="stat-card" key={label}>
              <div>
                <span>{label}</span>
                <Icon size={18} />
              </div>
              <strong>{value ?? "—"}</strong>
              <small>{note}</small>
            </div>
          ))}
        </div>
      )}
      <div className="section-heading">
        <div>
          <h2>
            Your projects <span className="count">{counts?.projects ?? 0}</span>
          </h2>
          <p>Pick up where your team left off.</p>
        </div>
        <Link to="/projects" className="text-link">
          View all projects <ArrowRight size={16} />
        </Link>
      </div>
      {projects.isLoading ? (
        <Loading />
      ) : projects.error ? (
        <ErrorState error={projects.error} retry={projects.refetch} />
      ) : projects.data.data.length ? (
        <div className="projects-grid">
          {projects.data.data.map((p, i) => (
            <ProjectCard project={p} index={i} key={p._id} />
          ))}
        </div>
      ) : (
        <Empty
          title="Your first project starts here"
          description="Create a project, add your team, and outline the next steps."
          action={
            <Button onClick={() => setCreate(true)}>
              <Plus size={16} />
              Create project
            </Button>
          }
        />
      )}
      <div className="dashboard-bottom">
        <section className="panel">
          <div className="panel-heading">
            <h2>My latest assignments</h2>
            <Link to="/tasks" className="text-link">
              View all <ArrowUpRight size={16} />
            </Link>
          </div>
          {tasks.isLoading ? (
            <Loading />
          ) : tasks.error ? (
            <ErrorState error={tasks.error} retry={tasks.refetch} />
          ) : tasks.data.data.length ? (
            <div className="task-list">
              {tasks.data.data.map((t) => (
                <TaskRow key={t._id} task={t} onClick={() => setTask(t)} />
              ))}
            </div>
          ) : (
            <Empty
              title="You’re all caught up"
              description="Tasks assigned to you will appear here."
              icon={CheckCircle2}
            />
          )}
        </section>
        <section className="panel activity-panel">
          <div className="panel-heading">
            <h2>Latest updates</h2>
            <Bell size={17} />
          </div>
          {notifications.error ? (
            <ErrorState
              error={notifications.error}
              retry={notifications.refetch}
            />
          ) : notifications.isLoading ? (
            <Loading />
          ) : notifications.data.data.length ? (
            <div className="activity-list">
              {notifications.data.data.map((n) => (
                <Link
                  to={`/projects/${n.project}${n.task ? `?task=${n.task}` : ""}`}
                  key={n._id}
                >
                  <span className={`activity-dot ${n.readAt ? "read" : ""}`} />
                  <div>
                    <p>{n.message}</p>
                    <small>{dateLabel(n.createdAt)}</small>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Empty
              title="A quiet moment"
              description="Project updates will find you here."
              icon={Bell}
            />
          )}
          <Link className="activity-footer" to="/notifications">
            All notifications <ArrowRight size={15} />
          </Link>
        </section>
      </div>
      {create && (
        <ProjectForm
          onClose={() => setCreate(false)}
          onCreated={(p) => navigate(`/projects/${p._id}`)}
        />
      )}{" "}
      {task && (
        <TaskDialog
          projectId={task.project}
          taskId={task._id}
          onClose={() => setTask(null)}
        />
      )}
    </Page>
  );
}
