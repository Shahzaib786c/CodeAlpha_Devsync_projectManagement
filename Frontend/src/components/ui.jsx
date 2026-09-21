import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  Layers,
  ArrowUpRight,
  X,
  LoaderCircle,
  Search,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Check,
} from "lucide-react";
import { Link } from "react-router-dom";
import { initials, statuses, dateLabel, overdue } from "../utils/format";
import { errorMessage } from "../services/api";
export function Brand({ compact = false }) {
  return (
    <Link to="/" className="brand" aria-label="DevSync home">
      <motion.span
        className="brand-mark"
        initial={{ rotate: -12, scale: 0.85 }}
        animate={{ rotate: 0, scale: 1 }}
        whileHover={{ rotate: 8 }}
        transition={{ type: "spring", stiffness: 190, damping: 16 }}
      >
        <Layers size={24} />
      </motion.span>
      {!compact && (
        <span>
          Dev<span className="brand-light">Sync</span>
          <span className="brand-dot">.</span>
        </span>
      )}
    </Link>
  );
}
export function Avatar({ user, size = "sm" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [user?.avatarUrl]);
  return (
    <span
      className={`avatar avatar-${size}`}
      title={user?.name || "Unassigned"}
    >
      {user?.avatarUrl && !failed ? (
        <img
          src={user.avatarUrl}
          alt={user.name || "Profile picture"}
          onError={() => setFailed(true)}
        />
      ) : (
        initials(user?.name)
      )}
    </span>
  );
}
export function Button({
  children,
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <button
      className={`btn btn-${variant} ${className}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? <LoaderCircle className="spin" size={17} /> : null}
      {children}
    </button>
  );
}
export function IconButton({ label, children, ...props }) {
  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
}
export function Badge({ value, type = "status" }) {
  return (
    <span className={`badge ${type}-${value}`}>
      <i />
      {type === "status" ? statuses[value] : value}
    </span>
  );
}
export function Field({ label, error, children, hint }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {typeof children === "function" ? children(id) : children}
      {hint && <small>{hint}</small>}
      {error && <small className="error-text">{error}</small>}
    </div>
  );
}
export function SearchInput({ value, onChange, placeholder = "Search…" }) {
  return (
    <div className="search-input">
      <Search size={17} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <IconButton label="Clear search" onClick={() => onChange("")}>
          <X size={14} />
        </IconButton>
      )}
    </div>
  );
}
export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Page({ children }) {
  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.23 }}
    >
      {children}
    </motion.div>
  );
}
export function Loading({ label = "Loading your workspace…" }) {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={23} />
      <span>{label}</span>
    </div>
  );
}
export function ErrorState({ error, retry }) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={24} />
      <h3>We couldn’t load this.</h3>
      <p>{errorMessage(error)}</p>
      {retry && (
        <Button variant="secondary" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  );
}
export function Empty({
  title = "Nothing here yet",
  description,
  action,
  icon: Icon = FolderOpen,
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={27} />
      </span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
export function Pagination({ page, setPage, total = 0, limit = 12 }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return pages > 1 ? (
    <div className="pagination">
      <span>
        {total} items · Page {page} of {pages}
      </span>
      <div>
        <IconButton
          label="Previous page"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          <ChevronLeft size={18} />
        </IconButton>
        <IconButton
          label="Next page"
          disabled={page >= pages}
          onClick={() => setPage(page + 1)}
        >
          <ChevronRight size={18} />
        </IconButton>
      </div>
    </div>
  ) : null;
}
export function Modal({ title, subtitle, children, onClose, wide = false }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const heading = useId();
  useEffect(() => {
    const previous = document.activeElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const root = ref.current;
    const selectors =
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]';
    root.querySelector("input,textarea,select")?.focus();
    const key = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
      }
      if (e.key === "Tab") {
        const items = [...root.querySelectorAll(selectors)].filter(
          (el) => el.getClientRects().length,
        );
        const first = items[0],
          last = items.at(-1);
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            !root.contains(document.activeElement))
        ) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    if (!root.contains(document.activeElement)) root.focus();
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.section
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={heading}
        className={`modal ${wide ? "modal-wide" : ""}`}
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
      >
        <header className="modal-header">
          <div>
            <h2 id={heading}>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <IconButton label="Close dialog" onClick={onClose}>
            <X size={20} />
          </IconButton>
        </header>
        {children}
      </motion.section>
    </div>,
    document.body,
  );
}
export function Confirm({ title, description, onConfirm, onClose, loading }) {
  return (
    <Modal title={title} onClose={loading ? () => {} : onClose}>
      <p className="confirm-description">{description}</p>
      <div className="form-actions">
        <Button variant="secondary" disabled={loading} onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" loading={loading} onClick={onConfirm}>
          Confirm
        </Button>
      </div>
    </Modal>
  );
}
export function ProjectCard({ project, index = 0 }) {
  return (
    <Link to={`/projects/${project._id}`} className="project-card">
      <div className="project-card-top">
        <span className={`project-symbol symbol-${index % 4}`}>
          <Layers size={21} />
        </span>
        <ArrowUpRight size={18} />
      </div>
      <h3>{project.name}</h3>
      <p>
        {project.description ||
          "Open the project to organize tasks and bring your team together."}
      </p>
      <div className="project-card-bottom">
        <span>
          {project.members.length}{" "}
          {project.members.length === 1 ? "member" : "members"}
        </span>
        <span>Created {dateLabel(project.createdAt)}</span>
      </div>
    </Link>
  );
}
export function TaskRow({ task, onClick, projectName }) {
  return (
    <button className="task-row" onClick={onClick}>
      <span
        className={`task-check ${task.status === "completed" ? "checked" : ""}`}
      >
        {task.status === "completed" && <Check size={14} />}
      </span>
      <span className="task-row-title">
        <strong>{task.title}</strong>
        {projectName && <small>{projectName}</small>}
      </span>
      <Badge value={task.status} />
      <span className={overdue(task) ? "due overdue" : "due"}>
        {dateLabel(task.dueDate)}
      </span>
      <Avatar user={task.assigneeUser} />
    </button>
  );
}
