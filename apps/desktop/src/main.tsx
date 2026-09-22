import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";

// Initialize theme immediately before first paint
const savedTheme = localStorage.getItem("invoiceflow_theme");
if (savedTheme === "daylight") {
    document.documentElement.classList.add("daylight");
    document.body.classList.add("daylight");
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
