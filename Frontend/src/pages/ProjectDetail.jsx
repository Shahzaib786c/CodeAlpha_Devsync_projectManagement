import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Plus,
  Columns3,
  List,
  Users,
  Settings,
  ArrowLeft,
  Trash2,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import {
  Page,
  Button,
  Loading,
  ErrorState,
  SearchInput,
  Pagination,
  Empty,
  TaskRow,
  Avatar,
  Confirm,
} from "../components/ui";
import {
  useReadQuery,
  useWriteMutation,
  query,
  errorMessage,
} from "../services/api";
import { useProjectRoom } from "../services/Realtime";
import ProjectForm from "../components/ProjectForm";
import TaskDialog, { NewTask } from "../components/TaskDialog";
import TaskBoard from "../components/TaskBoard";
import ProjectMembers from "../components/ProjectMembers";
export default function ProjectDetail() {
  const { projectId } = useParams();
  useProjectRoom(projectId);
  const [params, setParams] = useSearchParams();
  const taskId = params.get("task");
  const [tab, setTab] = useState("board");
  const [create, setCreate] = useState(false);
  const [edit, setEdit] = useState(false);
  const [remove, setRemove] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    priority: "",
    assignee: "",
  });
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(filters.search), 300);
    return () => clearTimeout(timer);
  }, [filters.search]);
  useEffect(() => setPage(1), [debounced, filters.priority, filters.assignee]);
  const result = useReadQuery(`/projects/${projectId}`);
  const project = result.data?.data;
  const user = useSelector((s) => s.auth.user);
  const navigate = useNavigate();
  const [write, { isLoading }] = useWriteMutation();
  const list = useReadQuery(
    query(`/projects/${projectId}/tasks`, {
      ...filters,
      search: debounced,
      page,
      limit: 15,
    }),
    { skip: tab !== "list" || !project },
  );
  const openTask = (id) => setParams({ task: id });
  if (result.isLoading)
    return (
      <Page>
        <Loading />
      </Page>
    );
  if (result.error)
    return (
      <Page>
        <Link to="/projects" className="back-link">
          <ArrowLeft size={16} />
          All projects
        </Link>
        <ErrorState error={result.error} retry={result.refetch} />
      </Page>
    );
  return (
    <Page>
      <Link to="/projects" className="back-link">
        <ArrowLeft size={15} />
        All projects
      </Link>
      <div className="project-title-row">
        <span className="project-title-icon">
          <Layers size={26} />
        </span>
        <div>
          <p className="eyebrow">PROJECT WORKSPACE</p>
          <h1>{project.name}</h1>
        </div>
        <div className="project-title-actions">
          {project.owner === user._id && (
            <Button variant="secondary" onClick={() => setEdit(true)}>
              <Settings size={16} />
              Edit project
            </Button>
          )}
          <Button onClick={() => setCreate(true)}>
            <Plus size={17} />
            New task
          </Button>
        </div>
      </div>
      <p className="project-description">
        {project.description ||
          "Give this project a description to share its purpose with your team."}
      </p>
      <div className="project-subline">
        <div className="avatar-stack">
          {project.memberUsers.slice(0, 5).map((u) => (
            <Avatar user={u} key={u._id} />
          ))}
        </div>
        <button className="text-button" onClick={() => setTab("members")}>
          {project.members.length}{" "}
          {project.members.length === 1 ? "member" : "members"}
        </button>
        <span className="role-badge">
          {project.owner === user._id
            ? "You own this project"
            : "Shared with you"}
        </span>
      </div>
      <div className="project-tabs" role="tablist" aria-label="Project views">
        {[
          ["board", "Board", Columns3],
          ["list", "List", List],
          ["members", "Members", Users],
        ].map(([value, label, Icon]) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            className={tab === value ? "active" : ""}
            onClick={() => setTab(value)}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>
      {tab === "members" ? (
        <>
          <ProjectMembers project={project} />
          {project.owner === user._id && (
            <div className="danger-zone">
              <div>
                <h3>Delete project</h3>
                <p>
                  Remove this project and access to its tasks and discussions.
                </p>
              </div>
              <Button variant="danger-outline" onClick={() => setRemove(true)}>
                <Trash2 size={16} />
                Delete project
              </Button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="filter-bar">
            <SearchInput
              placeholder="Search tasks…"
              value={filters.search}
              onChange={(search) => setFilters({ ...filters, search })}
            />
            <div className="filter-selects">
              <select
                aria-label="Filter by priority"
                value={filters.priority}
                onChange={(e) =>
                  setFilters({ ...filters, priority: e.target.value })
                }
              >
                <option value="">All priorities</option>
                {["high", "medium", "low"].map((v) => (
                  <option key={v} value={v}>
                    {v[0].toUpperCase() + v.slice(1)} priority
                  </option>
                ))}
              </select>
              <select
                aria-label="Filter by assignee"
                value={filters.assignee}
                onChange={(e) =>
                  setFilters({ ...filters, assignee: e.target.value })
                }
              >
                <option value="">All assignees</option>
                {project.memberUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {tab === "board" ? (
            <TaskBoard
              projectId={projectId}
              filters={{ ...filters, search: debounced }}
              onTask={openTask}
            />
          ) : list.isLoading ? (
            <Loading />
          ) : list.error ? (
            <ErrorState error={list.error} retry={list.refetch} />
          ) : (
            <div className="panel">
              {list.data?.data.length ? (
                <div className="task-list">
                  {list.data.data.map((t) => (
                    <TaskRow
                      key={t._id}
                      task={t}
                      onClick={() => openTask(t._id)}
                    />
                  ))}
                </div>
              ) : (
                <Empty
                  title="No tasks found"
                  description="Create a task or adjust your filters."
                />
              )}
              <Pagination
                page={page}
                setPage={setPage}
                total={list.data?.total}
                limit={15}
              />
            </div>
          )}
        </>
      )}
      {create && <NewTask project={project} onClose={() => setCreate(false)} />}{" "}
      {edit && <ProjectForm project={project} onClose={() => setEdit(false)} />}{" "}
      {taskId && (
        <TaskDialog
          projectId={projectId}
          taskId={taskId}
          onClose={() => setParams({})}
        />
      )}
      {remove && (
        <Confirm
          title="Delete this project?"
          description="All members will lose access to this project and its tasks. You cannot restore it from the app."
          loading={isLoading}
          onClose={() => setRemove(false)}
          onConfirm={async () => {
            try {
              await write({
                url: `/projects/${projectId}`,
                method: "DELETE",
              }).unwrap();
              toast.success("Project deleted");
              navigate("/projects");
            } catch (e) {
              toast.error(errorMessage(e));
            }
          }}
        />
      )}
    </Page>
  );
}
