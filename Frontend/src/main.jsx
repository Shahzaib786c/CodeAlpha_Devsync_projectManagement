import React, { Component } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { store } from "./app/store";
import AppRoutes from "./routes/AppRoutes";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "./styles/global.css";
class ErrorBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="full-screen">
        <h1>Let’s get you back on track.</h1>
        <p>
          The page hit an unexpected error. Your saved work is still on the
          server.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => window.location.assign("/")}
        >
          Reload workspace
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          <MotionConfig reducedMotion="user">
            <AppRoutes />
            <Toaster
              position="bottom-right"
              closeButton
              duration={4200}
              icons={{
                success: <CheckCircle2 size={21} />,
                error: <AlertCircle size={21} />,
                info: <Info size={21} />,
              }}
              toastOptions={{ className: "devsync-toast" }}
            />
          </MotionConfig>
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>,
);
