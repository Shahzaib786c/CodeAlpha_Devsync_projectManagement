import { useState } from "react";
import { toast } from "sonner";
import { Modal, Field, Button } from "./ui";
import { useWriteMutation, errorMessage } from "../services/api";
export default function ProjectForm({ project, onClose, onCreated }) {
  const [name, setName] = useState(project?.name || "");
  const [description, setDescription] = useState(project?.description || "");
  const [error, setError] = useState("");
  const [write, { isLoading }] = useWriteMutation();
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const result = await write({
        url: project ? `/projects/${project._id}` : "/projects",
        method: project ? "PATCH" : "POST",
        body: { name: name.trim(), description: description.trim() },
      }).unwrap();
      toast.success(project ? "Project updated" : "Your project is ready", {
        description: name,
      });
      onClose();
      onCreated?.(result.data);
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  return (
    <Modal
      title={project ? "Edit project" : "Create a project"}
      subtitle="A shared space for your team’s next big thing."
      onClose={isLoading ? () => {} : onClose}
    >
      <form onSubmit={submit}>
        <Field label="Project name">
          {(id) => (
            <input
              id={id}
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website redesign"
            />
          )}
        </Field>
        <Field
          label="Description"
          hint="Optional. Give your team a little context."
        >
          {(id) => (
            <textarea
              id={id}
              maxLength={2000}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are we working toward?"
            />
          )}
        </Field>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <Button
            variant="secondary"
            type="button"
            disabled={isLoading}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button loading={isLoading} disabled={!name.trim()}>
            {project ? "Save project" : "Create project"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
