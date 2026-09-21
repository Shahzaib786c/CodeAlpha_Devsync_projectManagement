import { useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { GripVertical, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Avatar, Badge, Loading, ErrorState, Pagination } from "./ui";
import {
  useReadQuery,
  useWriteMutation,
  query,
  errorMessage,
} from "../services/api";
import { statuses, dateLabel, overdue } from "../utils/format";
export default function TaskBoard({ projectId, filters, onTask }) {
  const [write, { isLoading }] = useWriteMutation();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const end = async ({ active, over }) => {
    if (!over || active.data.current.status === over.id) return;
    try {
      await write({
        url: `/projects/${projectId}/tasks/${active.id}/status`,
        method: "PATCH",
        body: { status: over.id },
      }).unwrap();
      toast.success(`Moved to ${statuses[over.id]}`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  return (
    <DndContext sensors={sensors} onDragEnd={end}>
      <div className="board">
        {Object.entries(statuses).map(([value, label]) => (
          <Column
            key={value}
            status={value}
            label={label}
            projectId={projectId}
            filters={filters}
            onTask={onTask}
            disabled={isLoading}
          />
        ))}
      </div>
      <p className="board-hint">
        Drag a card by its handle to move it. You can also open a task and
        change its status.
      </p>
    </DndContext>
  );
}
function Column({ status, label, projectId, filters, onTask, disabled }) {
  const [page, setPage] = useState(1);
  useEffect(
    () => setPage(1),
    [filters.search, filters.priority, filters.assignee],
  );
  const result = useReadQuery(
    query(`/projects/${projectId}/tasks`, {
      ...filters,
      status,
      page,
      limit: 8,
    }),
  );
  const { setNodeRef, isOver } = useDroppable({ id: status });
  useEffect(() => {
    if (result.data && page > 1 && !result.data.data.length)
      setPage((p) => p - 1);
  }, [result.data, page]);
  return (
    <section
      ref={setNodeRef}
      className={`board-column column-${status} ${isOver ? "drag-over" : ""}`}
    >
      <div className="column-heading">
        <h3>
          <i />
          {label}
          <span>{result.data?.total ?? 0}</span>
        </h3>
        <span className="column-line" />
      </div>
      {result.isLoading ? (
        <Loading label="Loading tasks…" />
      ) : result.error ? (
        <ErrorState error={result.error} retry={result.refetch} />
      ) : result.data.data.length ? (
        result.data.data.map((task) => (
          <Card
            key={task._id}
            task={task}
            onClick={() => onTask(task._id)}
            disabled={disabled}
          />
        ))
      ) : (
        <div className="column-empty">
          {filters.search || filters.priority || filters.assignee
            ? "No matching tasks"
            : "No tasks here yet"}
        </div>
      )}
      <Pagination
        page={page}
        setPage={setPage}
        total={result.data?.total}
        limit={8}
      />
    </section>
  );
}
function Card({ task, onClick, disabled }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task._id, data: { status: task.status }, disabled });
  return (
    <article
      ref={setNodeRef}
      style={
        transform
          ? {
              transform: `translate3d(${transform.x}px,${transform.y}px,0)`,
              zIndex: 20,
            }
          : undefined
      }
      className={`kanban-card ${isDragging ? "dragging" : ""}`}
    >
      <div className="kanban-card-head">
        <Badge value={task.priority} type="priority" />
        <button
          className="drag-handle"
          {...attributes}
          {...listeners}
          aria-label={`Move ${task.title}`}
        >
          <GripVertical size={16} />
        </button>
      </div>
      <button className="kanban-open" onClick={onClick}>
        <h4>{task.title}</h4>
        {task.description && <p>{task.description}</p>}
      </button>
      <div className="kanban-card-foot">
        <span className={overdue(task) ? "overdue" : ""}>
          <CalendarDays size={14} />
          {dateLabel(task.dueDate)}
        </span>
        <Avatar user={task.assigneeUser} />
      </div>
    </article>
  );
}
