import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "@fontsource/instrument-sans/400.css";
import "@fontsource/instrument-sans/500.css";
import "@fontsource/instrument-sans/600.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./index.css";
import App from "./App.jsx";

const toastStyle = {
  background: "rgb(var(--surface))",
  color: "rgb(var(--ink))",
  border: "1px solid rgb(var(--line))",
  borderRadius: "4px",
  fontSize: "14px",
  padding: "10px 12px",
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: toastStyle,
        success: { iconTheme: { primary: "rgb(var(--ok))", secondary: "rgb(var(--bg))" } },
        error: { iconTheme: { primary: "rgb(var(--bad))", secondary: "rgb(var(--bg))" } },
      }}
    />
    <App />
  </React.StrictMode>
);
