import { useState } from "react";
import { Link } from "react-router-dom";
import { Users, ArrowUpRight } from "lucide-react";
import {
  Page,
  PageHeader,
  Loading,
  ErrorState,
  Empty,
  Pagination,
} from "../components/ui";
import { useReadQuery, query } from "../services/api";
import ProjectMembers from "../components/ProjectMembers";
export default function Team() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState("");
  const projects = useReadQuery(query("/projects", { page, limit: 10 }));
  const chosen = selected || projects.data?.data[0]?._id;
  const details = useReadQuery(`/projects/${chosen}`, { skip: !chosen });
  return (
    <Page>
      <PageHeader
        eyebrow="BETTER, TOGETHER"
        title="Your team"
        description="The people behind your projects. Manage access one project at a time."
      />
      {projects.isLoading ? (
        <Loading />
      ) : projects.error ? (
        <ErrorState error={projects.error} retry={projects.refetch} />
      ) : projects.data.data.length ? (
        <div className="team-layout">
          <aside className="project-picker panel">
            <h3>Projects</h3>
            {projects.data.data.map((p) => (
              <button
                key={p._id}
                className={chosen === p._id ? "active" : ""}
                onClick={() => setSelected(p._id)}
              >
                <Users size={17} />
                <span>{p.name}</span>
                <small>{p.members.length}</small>
              </button>
            ))}
            <Pagination
              page={page}
              setPage={(value) => {
                setPage(value);
                setSelected("");
              }}
              total={projects.data.total}
              limit={10}
            />
          </aside>
          <section className="panel team-detail">
            {details.isLoading ||
            (details.isFetching && !details.currentData) ? (
              <Loading />
            ) : details.error ? (
              <ErrorState error={details.error} retry={details.refetch} />
            ) : (
              details.data && (
                <>
                  <div className="panel-heading">
                    <h2>{details.data.data.name}</h2>
                    <Link to={`/projects/${chosen}`} className="text-link">
                      Open project <ArrowUpRight size={16} />
                    </Link>
                  </div>
                  <ProjectMembers key={chosen} project={details.data.data} />
                </>
              )
            )}
          </section>
        </div>
      ) : (
        <Empty
          title="Your team starts with a project"
          description="Create a project, then add people who have registered on DevSync."
          icon={Users}
          action={
            <Link className="btn btn-primary" to="/projects">
              Go to projects
            </Link>
          }
        />
      )}
    </Page>
  );
}
