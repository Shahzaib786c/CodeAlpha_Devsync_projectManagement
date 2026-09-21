import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Check,
  ArrowUpRight,
  MessageSquare,
  UserPlus,
  ListTodo,
} from "lucide-react";
import { toast } from "sonner";
import {
  Page,
  PageHeader,
  Loading,
  ErrorState,
  Empty,
  Pagination,
  IconButton,
} from "../components/ui";
import {
  useReadQuery,
  useWriteMutation,
  query,
  errorMessage,
} from "../services/api";
import { fullDate } from "../utils/format";
export default function Notifications() {
  const [unread, setUnread] = useState(false);
  const [page, setPage] = useState(1);
  const result = useReadQuery(
    query("/notifications", {
      page,
      limit: 15,
      unread: unread ? "true" : "false",
    }),
  );
  const [write, { isLoading }] = useWriteMutation();
  return (
    <Page>
      <PageHeader
        eyebrow="KEEP UP WITH YOUR TEAM"
        title="Notifications"
        description="Assignments, conversations, and progress that involve you."
      />
      <div className="section-heading">
        <div className="segmented">
          <button
            className={!unread ? "active" : ""}
            onClick={() => {
              setUnread(false);
              setPage(1);
            }}
          >
            All updates
          </button>
          <button
            className={unread ? "active" : ""}
            onClick={() => {
              setUnread(true);
              setPage(1);
            }}
          >
            Unread <span className="count">{result.data?.unread || 0}</span>
          </button>
        </div>
        <span className="muted small">Newest first</span>
      </div>
      <section className="panel notifications-panel">
        {result.isLoading ? (
          <Loading />
        ) : result.error ? (
          <ErrorState error={result.error} retry={result.refetch} />
        ) : result.data.data.length ? (
          result.data.data.map((n) => {
            const Icon =
              n.kind === "comment"
                ? MessageSquare
                : n.kind === "membership"
                  ? UserPlus
                  : ListTodo;
            return (
              <article
                className={`notification-row ${n.readAt ? "" : "unread"}`}
                key={n._id}
              >
                <span className="notification-icon">
                  <Icon size={20} />
                </span>
                <Link
                  to={`/projects/${n.project}${n.task ? `?task=${n.task}` : ""}`}
                  className="notification-content"
                >
                  <p>{n.message}</p>
                  <time>{fullDate(n.createdAt)}</time>
                </Link>
                {!n.readAt ? (
                  <IconButton
                    label="Mark as read"
                    disabled={isLoading}
                    onClick={async () => {
                      try {
                        await write({
                          url: `/notifications/${n._id}/read`,
                          method: "PATCH",
                        }).unwrap();
                        if (unread && result.data.data.length === 1 && page > 1)
                          setPage(page - 1);
                      } catch (e) {
                        toast.error(errorMessage(e));
                      }
                    }}
                  >
                    <Check size={18} />
                  </IconButton>
                ) : (
                  <span className="read-label">Read</span>
                )}
              </article>
            );
          })
        ) : (
          <Empty
            title={unread ? "You’re up to date" : "No notifications yet"}
            description="We’ll keep you posted when your team makes a move."
            icon={Bell}
          />
        )}
        <Pagination
          page={page}
          setPage={setPage}
          total={result.data?.total}
          limit={15}
        />
      </section>
    </Page>
  );
}
