import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Camera,
  Trash2,
  ShieldCheck,
  UserRound,
  LockKeyhole,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  Page,
  PageHeader,
  Avatar,
  Button,
  Field,
  IconButton,
  Confirm,
} from "../components/ui";
import { useWriteMutation, errorMessage } from "../services/api";
import { userUpdated, signedOut } from "../app/authSlice";
export default function Profile() {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const [name, setName] = useState(user.name);
  const [error, setError] = useState("");
  const [remove, setRemove] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const input = useRef(null);
  const [write, { isLoading }] = useWriteMutation();
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const save = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const result = await write({
        url: "/auth/me",
        method: "PATCH",
        body: { name: name.trim() },
      }).unwrap();
      dispatch(userUpdated(result.data));
      toast.success("Profile updated");
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  const pick = (e) => {
    const chosen = e.target.files?.[0];
    e.target.value = "";
    if (!chosen) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(chosen.type)) {
      toast.error("Choose a JPEG, PNG or WebP image.");
      return;
    }
    if (chosen.size > 2 * 1024 * 1024) {
      toast.error("Your image must be 2 MB or smaller.");
      return;
    }
    setFile(chosen);
  };
  const upload = async () => {
    const body = new FormData();
    body.append("avatar", file);
    try {
      const result = await write({
        url: "/auth/me/avatar",
        method: "PUT",
        body,
      }).unwrap();
      dispatch(userUpdated(result.data));
      setFile(null);
      toast.success("Profile picture updated");
      if (result.cleanupPending)
        toast.info(
          "Your picture was saved. The previous image needs storage cleanup.",
        );
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  return (
    <Page>
      <PageHeader
        eyebrow="MAKE IT YOURS"
        title="Profile & settings"
        description="Your identity, your account, your space."
      />
      <div className="profile-layout">
        <aside className="profile-summary panel">
          <Avatar
            user={{ ...user, avatarUrl: preview || user.avatarUrl }}
            size="xl"
          />
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <span className="profile-since">
            Member since{" "}
            {new Date(user.createdAt).toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </span>
          <div className="profile-summary-divider" />
          <div className="profile-tip">
            <ShieldCheck size={20} />
            <p>Your profile is visible to people in your shared projects.</p>
          </div>
        </aside>
        <div className="profile-sections">
          <section className="panel settings-panel">
            <div className="settings-heading">
              <Camera size={20} />
              <div>
                <h2>Profile picture</h2>
                <p>A familiar face for your team.</p>
              </div>
            </div>
            <div className="photo-controls">
              <Avatar
                user={{ ...user, avatarUrl: preview || user.avatarUrl }}
                size="lg"
              />
              <div>
                <div className="inline-actions">
                  <Button
                    variant="secondary"
                    disabled={isLoading}
                    onClick={() => input.current?.click()}
                  >
                    <Camera size={16} />
                    {user.avatarUrl ? "Change photo" : "Choose photo"}
                  </Button>
                  {user.avatarUrl && !file && (
                    <Button
                      variant="ghost"
                      disabled={isLoading}
                      onClick={() => setRemove(true)}
                    >
                      <Trash2 size={16} />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="muted small">
                  JPEG, PNG or WebP. Up to 2 MB. Cropped to a square.
                </p>
                <input
                  ref={input}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  aria-label="Choose profile picture"
                  className="visually-hidden"
                  onChange={pick}
                />
              </div>
            </div>
            {file && (
              <div className="photo-preview-actions">
                <span>{file.name}</span>
                <Button
                  variant="secondary"
                  disabled={isLoading}
                  onClick={() => setFile(null)}
                >
                  Cancel
                </Button>
                <Button loading={isLoading} onClick={upload}>
                  Save photo
                </Button>
              </div>
            )}
          </section>
          <section className="panel settings-panel">
            <div className="settings-heading">
              <UserRound size={20} />
              <div>
                <h2>Personal information</h2>
                <p>The details your teammates see.</p>
              </div>
            </div>
            <form onSubmit={save}>
              <Field label="Full name">
                {(id) => (
                  <input
                    id={id}
                    required
                    maxLength={80}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                )}
              </Field>
              <Field
                label="Email address"
                hint="Your registered email is used to identify your account and cannot be changed here."
              >
                {(id) => (
                  <input
                    id={id}
                    type="email"
                    value={user.email}
                    readOnly
                    className="readonly"
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
                  loading={isLoading}
                  disabled={!name.trim() || name.trim() === user.name}
                >
                  Save changes
                </Button>
              </div>
            </form>
          </section>
          <PasswordForm />
        </div>
      </div>
      {remove && (
        <Confirm
          title="Remove your profile picture?"
          description="Your initials will appear in its place."
          loading={isLoading}
          onClose={() => setRemove(false)}
          onConfirm={async () => {
            try {
              const result = await write({
                url: "/auth/me/avatar",
                method: "DELETE",
              }).unwrap();
              dispatch(userUpdated(result.data));
              setRemove(false);
              toast.success("Profile picture removed");
              if (result.cleanupPending)
                toast.info(
                  "Your profile is updated. The stored image needs cleanup.",
                );
            } catch (e) {
              toast.error(errorMessage(e));
            }
          }}
        />
      )}
    </Page>
  );
}
function PasswordForm() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [write, { isLoading }] = useWriteMutation();
  const dispatch = useDispatch();
  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (new TextEncoder().encode(form.newPassword).length > 72) {
      setError("New password must be at most 72 UTF-8 bytes.");
      return;
    }
    setConfirm(true);
  };
  return (
    <section className="panel settings-panel">
      <div className="settings-heading">
        <LockKeyhole size={20} />
        <div>
          <h2>Password & security</h2>
          <p>Changing your password signs you out of all devices.</p>
        </div>
      </div>
      <form onSubmit={submit}>
        {[
          ["currentPassword", "Current password"],
          ["newPassword", "New password"],
          ["confirmPassword", "Confirm new password"],
        ].map(([key, label]) => (
          <Field
            key={key}
            label={label}
            hint={
              key === "newPassword"
                ? "At least 8 characters. Choose a password you haven’t used here."
                : ""
            }
          >
            {(id) => (
              <input
                id={id}
                type={show ? "text" : "password"}
                required
                minLength={key === "currentPassword" ? 1 : 8}
                maxLength={200}
                autoComplete={
                  key === "currentPassword"
                    ? "current-password"
                    : "new-password"
                }
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            )}
          </Field>
        ))}
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={show}
            onChange={(e) => setShow(e.target.checked)}
          />
          Show passwords
        </label>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="form-actions">
          <Button loading={isLoading}>Update password</Button>
        </div>
      </form>
      {confirm && (
        <Confirm
          title="Update your password?"
          description="All current sessions will end. Sign in again using your new password."
          loading={isLoading}
          onClose={() => setConfirm(false)}
          onConfirm={async () => {
            try {
              await write({
                url: "/auth/change-password",
                method: "PATCH",
                body: form,
              }).unwrap();
              dispatch(signedOut());
              toast.success(
                "Password changed. Sign in with your new password.",
              );
            } catch (e) {
              setConfirm(false);
              setError(errorMessage(e));
            }
          }}
        />
      )}
    </section>
  );
}
