import { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import {
  CalendarDays,
  UserRound,
  Pencil,
  Trash2,
  Send,
  MessageSquare,
  Check,
} from "lucide-react";
import {
  Modal,
  Button,
  Field,
  Avatar,
  Badge,
  Loading,
  ErrorState,
  Pagination,
  IconButton,
  Confirm,
} from "./ui";
import {
  useReadQuery,
  useWriteMutation,
  errorMessage,
  query,
} from "../services/api";
import {
  statuses,
  inputDate,
  dateToISO,
  dateLabel,
  fullDate,
} from "../utils/format";
export function TaskForm({ task, project, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    assignee: task?.assignee || "",
    status: task?.status || "pending",
    priority: task?.priority || "medium",
    dueDate: inputDate(task?.dueDate),
  });
  const [write, { isLoading }] = useWriteMutation();
  const [error, setError] = useState("");
  const change = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const result = await write({
        url: `/projects/${project._id}/tasks${task ? `/${task._id}` : ""}`,
        method: task ? "PATCH" : "POST",
        body: {
          ...form,
          title: form.title.trim(),
          description: form.description.trim(),
          assignee: form.assignee || null,
          dueDate: dateToISO(form.dueDate),
        },
      }).unwrap();
      toast.success(task ? "Task updated" : "Task created", {
        description: form.title,
      });
      onSaved?.(result.data);
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  return (
    <form onSubmit={submit}>
      <Field label="Task title">
        {(id) => (
          <input
            id={id}
            required
            maxLength={160}
            placeholder="What needs to be done?"
            value={form.title}
            onChange={change("title")}
          />
        )}
      </Field>
      <Field label="Description">
        {(id) => (
          <textarea
            id={id}
            rows={4}
            maxLength={5000}
            value={form.description}
            onChange={change("description")}
            placeholder="Details, context, and what success looks like…"
          />
        )}
      </Field>
      <div className="form-grid">
        <Field label="Status">
          {(id) => (
            <select id={id} value={form.status} onChange={change("status")}>
              {Object.entries(statuses).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Priority">
          {(id) => (
            <select id={id} value={form.priority} onChange={change("priority")}>
              {["low", "medium", "high"].map((v) => (
                <option key={v} value={v}>
                  {v[0].toUpperCase() + v.slice(1)}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Assignee">
          {(id) => (
            <select id={id} value={form.assignee} onChange={change("assignee")}>
              <option value="">Unassigned</option>
              {project.memberUsers?.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Due date">
          {(id) => (
            <input
              id={id}
              type="date"
              value={form.dueDate}
              onChange={change("dueDate")}
            />
          )}
        </Field>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <Button
          type="button"
          variant="secondary"
          disabled={isLoading}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button loading={isLoading} disabled={!form.title.trim()}>
          {task ? "Save changes" : "Create task"}
        </Button>
      </div>
    </form>
  );
}
export function NewTask({ project, onClose, initialStatus = "pending" }) {
  return (
    <Modal title="Create a task" subtitle={project.name} onClose={onClose} wide>
      <TaskForm project={project} task={null} onClose={onClose} />
    </Modal>
  );
}
export default function TaskDialog({ projectId, taskId, onClose }) {
  const taskQuery = useReadQuery(`/projects/${projectId}/tasks/${taskId}`);
  const projectQuery = useReadQuery(`/projects/${projectId}`);
  const user = useSelector((s) => s.auth.user);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [write, { isLoading }] = useWriteMutation();
  const task = taskQuery.currentData?.data,
    project = projectQuery.currentData?.data;
  const remove = async () => {
    try {
      await write({
        url: `/projects/${projectId}/tasks/${taskId}`,
        method: "DELETE",
      }).unwrap();
      toast.success("Task deleted");
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  if (deleting)
    return (
      <Confirm
        title="Delete this task?"
        description="This task and its discussion will no longer be accessible. This cannot be undone in the app."
        loading={isLoading}
        onClose={() => setDeleting(false)}
        onConfirm={remove}
      />
    );
  return (
    <Modal
      title={editing ? "Edit task" : task?.title || "Task details"}
      subtitle={project?.name}
      wide
      onClose={onClose}
    >
      {(!task && !taskQuery.error) || (!project && !projectQuery.error) ? (
        <Loading />
      ) : taskQuery.error || projectQuery.error ? (
        <ErrorState
          error={taskQuery.error || projectQuery.error}
          retry={() => {
            taskQuery.refetch();
            projectQuery.refetch();
          }}
        />
      ) : editing ? (
        <TaskForm
          task={task}
          project={project}
          onClose={() => setEditing(false)}
        />
      ) : (
        <>
          <div className="task-detail-toolbar">
            <Badge value={task.status} />
            <Badge value={task.priority} type="priority" />
            <div className="spacer" />
            <IconButton label="Edit task" onClick={() => setEditing(true)}>
              <Pencil size={17} />
            </IconButton>
            {(task.createdBy === user._id || project.owner === user._id) && (
              <IconButton label="Delete task" onClick={() => setDeleting(true)}>
                <Trash2 size={17} />
              </IconButton>
            )}
          </div>
          <p className="task-description">
            {task.description || "No description added."}
          </p>
          <div className="task-metadata">
            <div>
              <UserRound size={16} />
              <span>Assigned to</span>
              <Avatar user={task.assigneeUser} />
              <strong>{task.assigneeUser?.name || "Unassigned"}</strong>
            </div>
            <div>
              <CalendarDays size={16} />
              <span>Due date</span>
              <strong>{dateLabel(task.dueDate)}</strong>
            </div>
          </div>
          <Field label="Move to">
            {(id) => (
              <select
                id={id}
                value={task.status}
                disabled={isLoading}
                onChange={async (e) => {
                  try {
                    await write({
                      url: `/projects/${projectId}/tasks/${taskId}/status`,
                      method: "PATCH",
                      body: { status: e.target.value },
                    }).unwrap();
                    toast.success("Task status updated");
                  } catch (e) {
                    toast.error(errorMessage(e));
                  }
                }}
              >
                {Object.entries(statuses).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Comments project={project} taskId={taskId} />
        </>
      )}
    </Modal>
  );
}
function Comments({ project, taskId }) {
  const [page, setPage] = useState(1);
  const [body, setBody] = useState("");
  const [edit, setEdit] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState("");
  const user = useSelector((s) => s.auth.user);
  const path = `/projects/${project._id}/tasks/${taskId}/comments`;
  const result = useReadQuery(query(path, { page, limit: 10 }));
  const [write, { isLoading }] = useWriteMutation();
  const send = async (e) => {
    e.preventDefault();
    try {
      await write({ url: path, body: { body: body.trim() } }).unwrap();
      setBody("");
      setError("");
      setPage(Math.ceil(((result.data?.total || 0) + 1) / 10));
      toast.success("Comment posted");
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  const update = async () => {
    try {
      await write({
        url: `${path}/${edit.id}`,
        method: "PATCH",
        body: { body: edit.body.trim() },
      }).unwrap();
      setEdit(null);
      toast.success("Comment updated");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  const remove = async (id) => {
    try {
      await write({ url: `${path}/${id}`, method: "DELETE" }).unwrap();
      setDeleteId(null);
      if (result.data?.data.length === 1 && page > 1) setPage(page - 1);
      toast.success("Comment deleted");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  return (
    <section className="comments">
      <h3>
        <MessageSquare size={18} /> Discussion{" "}
        <span className="count">{result.data?.total || 0}</span>
      </h3>
      {result.isLoading ? (
        <Loading />
      ) : result.error ? (
        <ErrorState error={result.error} retry={result.refetch} />
      ) : result.data.data.length ? (
        result.data.data.map((c) => (
          <article className="comment" key={c._id}>
            <Avatar user={c.authorUser} />
            <div className="comment-main">
              <div className="comment-heading">
                <strong>{c.authorUser?.name}</strong>
                <time title={fullDate(c.createdAt)}>
                  {dateLabel(c.createdAt)}
                </time>
              </div>
              {edit?.id === c._id ? (
                <div>
                  <textarea
                    aria-label="Edit comment"
                    value={edit.body}
                    maxLength={3000}
                    onChange={(e) => setEdit({ ...edit, body: e.target.value })}
                  />
                  <div className="inline-actions">
                    <Button variant="secondary" onClick={() => setEdit(null)}>
                      Cancel
                    </Button>
                    <Button
                      loading={isLoading}
                      disabled={!edit.body.trim()}
                      onClick={update}
                    >
                      Save comment
                    </Button>
                  </div>
                </div>
              ) : (
                <p>{c.body}</p>
              )}
              {deleteId === c._id ? (
                <div className="inline-confirm">
                  <span>Delete this comment?</span>
                  <button disabled={isLoading} onClick={() => remove(c._id)}>
                    Delete
                  </button>
                  <button onClick={() => setDeleteId(null)}>Keep</button>
                </div>
              ) : (
                <div className="comment-actions">
                  {c.author === user._id && (
                    <button
                      onClick={() => setEdit({ id: c._id, body: c.body })}
                    >
                      Edit
                    </button>
                  )}
                  {(c.author === user._id || project.owner === user._id) && (
                    <button onClick={() => setDeleteId(c._id)}>Delete</button>
                  )}
                </div>
              )}
            </div>
          </article>
        ))
      ) : (
        <p className="muted small">
          Start the conversation. Share an update or ask a question.
        </p>
      )}
      <Pagination
        page={page}
        setPage={setPage}
        total={result.data?.total}
        limit={10}
      />
      <form onSubmit={send} className="comment-form">
        <Avatar user={user} />
        <div>
          <textarea
            aria-label="Write a comment"
            placeholder="Write a comment…"
            required
            maxLength={3000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <Button loading={isLoading} disabled={!body.trim()}>
            <Send size={15} /> Post comment
          </Button>
        </div>
      </form>
    </section>
  );
}
