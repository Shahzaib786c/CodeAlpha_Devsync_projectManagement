import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FolderKanban } from "lucide-react";
import {
  Page,
  PageHeader,
  Button,
  ProjectCard,
  Loading,
  ErrorState,
  Empty,
  Pagination,
} from "../components/ui";
import { useReadQuery, query } from "../services/api";
import ProjectForm from "../components/ProjectForm";
export default function Projects() {
  const [page, setPage] = useState(1);
  const [create, setCreate] = useState(false);
  const navigate = useNavigate();
  const result = useReadQuery(query("/projects", { page, limit: 12 }));
  return (
    <Page>
      <PageHeader
        eyebrow="YOUR SHARED SPACES"
        title="Projects"
        description="The big picture, broken into work that matters."
        action={
          <Button onClick={() => setCreate(true)}>
            <Plus size={18} />
            New project
          </Button>
        }
      />
      <div className="section-heading">
        <h2>
          All projects <span className="count">{result.data?.total || 0}</span>
        </h2>
        <span className="muted small">Most recently created first</span>
      </div>
      {result.isLoading ? (
        <Loading />
      ) : result.error ? (
        <ErrorState error={result.error} retry={result.refetch} />
      ) : result.data.data.length ? (
        <div className="projects-grid projects-page-grid">
          {result.data.data.map((p, i) => (
            <ProjectCard key={p._id} project={p} index={i} />
          ))}
        </div>
      ) : (
        <Empty
          title="Make space for your next project"
          description="Start a project to organize tasks and collaborate with your team."
          icon={FolderKanban}
          action={
            <Button onClick={() => setCreate(true)}>Create project</Button>
          }
        />
      )}
      <Pagination page={page} setPage={setPage} total={result.data?.total} />
      {create && (
        <ProjectForm
          onClose={() => setCreate(false)}
          onCreated={(p) => navigate(`/projects/${p._id}`)}
        />
      )}
    </Page>
  );
}
