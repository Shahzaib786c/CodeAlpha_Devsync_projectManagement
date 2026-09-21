import { useEffect, useState } from "react";
import { ListTodo } from "lucide-react";
import {
  Page,
  PageHeader,
  SearchInput,
  Loading,
  ErrorState,
  Empty,
  Pagination,
  TaskRow,
} from "../components/ui";
import { query, useReadQuery } from "../services/api";
import TaskDialog from "../components/TaskDialog";
import { statuses } from "../utils/format";
export default function MyTasks() {
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const [task, setTask] = useState(null);
  useEffect(() => {
    const timer = setTimeout(() => setTerm(search), 300);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => setPage(1), [status, priority, term]);
  const result = useReadQuery(
    query("/tasks/mine", { status, priority, search: term, page, limit: 15 }),
  );
  return (
    <Page>
      <PageHeader
        eyebrow="YOUR PERSONAL FOCUS"
        title="My tasks"
        description="Everything assigned to you, across your projects."
      />
      <div className="filter-bar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search my tasks…"
        />
        <div className="filter-selects">
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {Object.entries(statuses).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="">All priorities</option>
            {["high", "medium", "low"].map((v) => (
              <option key={v} value={v}>
                {v[0].toUpperCase() + v.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="panel">
        <div className="panel-heading">
          <h2>
            Assigned to me{" "}
            <span className="count">{result.data?.total || 0}</span>
          </h2>
          <span className="muted small">Latest first</span>
        </div>
        {result.isLoading ? (
          <Loading />
        ) : result.error ? (
          <ErrorState error={result.error} retry={result.refetch} />
        ) : result.data.data.length ? (
          <div className="task-list">
            {result.data.data.map((t) => (
              <TaskRow task={t} key={t._id} onClick={() => setTask(t)} />
            ))}
          </div>
        ) : (
          <Empty
            title="No matching assignments"
            description="Tasks assigned to you will appear here. Try clearing your filters."
            icon={ListTodo}
          />
        )}
        <Pagination
          page={page}
          setPage={setPage}
          total={result.data?.total}
          limit={15}
        />
      </div>
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
