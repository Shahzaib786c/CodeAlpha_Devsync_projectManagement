import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  GitBranch,
  Layers,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Brand, Button, Field, IconButton } from "../components/ui";
import { useWriteMutation, errorMessage } from "../services/api";
import { signedIn } from "../app/authSlice";
export default function Auth({ register = false }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [write, { isLoading }] = useWriteMutation();
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);
  if (token) return <Navigate to="/" replace />;
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (register && new TextEncoder().encode(password).length > 72) {
      setError("Password must be no more than 72 UTF-8 bytes.");
      return;
    }
    try {
      const data = await write({
        url: register ? "/auth/register" : "/auth/login",
        body: {
          ...(register ? { name: name.trim() } : {}),
          email: email.trim(),
          password,
        },
      }).unwrap();
      dispatch(signedIn(data));
      toast.success(register ? "Welcome to DevSync" : "Welcome back", {
        description: data.user.name,
      });
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  return (
    <div className="auth-page">
      <div className="auth-form-side">
        <Brand />
        <div className="auth-form-wrap">
          <p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
          <h1>
            {register
              ? "Make room for\ngreat work."
              : "Good to have\nyou back."}
          </h1>
          <p className="auth-subtitle">
            {register
              ? "Create your account and bring your projects together."
              : "Sign in to your projects, your team, and what’s next."}
          </p>
          <form onSubmit={submit}>
            {register && (
              <Field label="Full name">
                {(id) => (
                  <input
                    id={id}
                    autoComplete="name"
                    required
                    maxLength={80}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                )}
              </Field>
            )}
            <Field label="Email address">
              {(id) => (
                <input
                  id={id}
                  autoComplete="email"
                  type="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              )}
            </Field>
            <Field
              label="Password"
              hint={register ? "At least 8 characters." : ""}
            >
              {(id) => (
                <div className="password-input">
                  <input
                    id={id}
                    type={show ? "text" : "password"}
                    autoComplete={
                      register ? "new-password" : "current-password"
                    }
                    required
                    minLength={register ? 8 : 1}
                    maxLength={200}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      register
                        ? "Create a strong password"
                        : "Enter your password"
                    }
                  />
                  <IconButton
                    label={show ? "Hide password" : "Show password"}
                    type="button"
                    onClick={() => setShow(!show)}
                  >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </IconButton>
                </div>
              )}
            </Field>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <Button className="auth-submit" loading={isLoading}>
              {register ? "Create account" : "Sign in"}
              <ArrowRight size={18} />
            </Button>
          </form>
          <p className="auth-switch">
            {register ? "Already part of the team?" : "New to DevSync?"}{" "}
            <Link to={register ? "/login" : "/register"}>
              {register ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
        <p className="auth-footnote">
          A clearer space to plan, create, and collaborate.
        </p>
      </div>
      <aside className="auth-story">
        <div className="auth-story-top">
          <span className="story-pill">
            <i /> A shared space for good work
          </span>
          <span>01 / DEVSYNC</span>
        </div>
        <h2>
          Different minds.
          <br />
          One <em>shared direction.</em>
        </h2>
        <p>
          Turn plans into progress. Keep every task, conversation, and teammate
          connected.
        </p>
        <motion.div
          className="auth-visual"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          aria-hidden="true"
        >
          <div className="visual-orbit orbit-one" />
          <div className="visual-orbit orbit-two" />
          <div className="visual-core">
            <Layers size={52} />
          </div>
          <div className="visual-chip chip-plan">
            <GitBranch size={20} />
            <span>Plan together</span>
          </div>
          <div className="visual-chip chip-work">
            <Check size={20} />
            <span>Make progress</span>
          </div>
          <div className="visual-chip chip-talk">
            <MessageCircle size={20} />
            <span>Stay connected</span>
          </div>
        </motion.div>
        <div className="story-bottom">
          <span>
            Thoughtfully organized.
            <br />
            Always in sync.
          </span>
          <span className="story-index">DS.</span>
        </div>
      </aside>
    </div>
  );
}
