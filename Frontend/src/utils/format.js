export const statuses = {
  pending: "To do",
  "in-progress": "In progress",
  completed: "Completed",
};
export const dateLabel = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "No due date";
export const fullDate = (value) =>
  value ? new Date(value).toLocaleString() : "";
export const initials = (name) =>
  (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
export const overdue = (task) =>
  task.dueDate &&
  task.status !== "completed" &&
  new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
export function inputDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export const dateToISO = (value) =>
  value ? new Date(`${value}T23:59:00`).toISOString() : null;
