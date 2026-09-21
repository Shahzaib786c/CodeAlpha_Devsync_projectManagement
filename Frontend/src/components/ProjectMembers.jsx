import { useState } from "react";
import { useSelector } from "react-redux";
import { UserPlus, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Avatar, Button, Field, IconButton, Confirm } from "./ui";
import { useWriteMutation, errorMessage } from "../services/api";
export default function ProjectMembers({ project }) {
  const user = useSelector((s) => s.auth.user);
  const owner = user._id === project.owner;
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [remove, setRemove] = useState(null);
  const [write, { isLoading }] = useWriteMutation();
  const add = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await write({
        url: `/projects/${project._id}/members`,
        body: { email: email.trim() },
      }).unwrap();
      setEmail("");
      toast.success("Member added to the project");
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  return (
    <div className="members-panel">
      {owner && (
        <form className="invite-form" onSubmit={add}>
          <div>
            <h3>Bring your team together</h3>
            <p>Add someone using their registered email address.</p>
          </div>
          <div className="invite-input">
            <input
              aria-label="Member email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@example.com"
            />
            <Button loading={isLoading}>
              <UserPlus size={17} /> Add member
            </Button>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
      <div className="member-list">
        {project.memberUsers?.map((member) => (
          <div className="member-row" key={member._id}>
            <Avatar user={member} size="md" />
            <div>
              <strong>
                {member.name}
                {member._id === user._id ? " (you)" : ""}
              </strong>
              <p>{member.email}</p>
            </div>
            <span
              className={`role-badge ${member._id === project.owner ? "owner" : ""}`}
            >
              {member._id === project.owner ? (
                <>
                  <ShieldCheck size={14} />
                  Owner
                </>
              ) : (
                "Member"
              )}
            </span>
            {owner && member._id !== project.owner && (
              <IconButton
                label={`Remove ${member.name}`}
                onClick={() => setRemove(member)}
              >
                <Trash2 size={17} />
              </IconButton>
            )}
          </div>
        ))}
      </div>
      {remove && (
        <Confirm
          title={`Remove ${remove.name}?`}
          description="They will lose access to this project, and their tasks will become unassigned."
          loading={isLoading}
          onClose={() => setRemove(null)}
          onConfirm={async () => {
            try {
              await write({
                url: `/projects/${project._id}/members/${remove._id}`,
                method: "DELETE",
              }).unwrap();
              setRemove(null);
              toast.success("Member removed");
            } catch (e) {
              toast.error(errorMessage(e));
            }
          }}
        />
      )}
    </div>
  );
}
