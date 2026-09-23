import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";

import { applyEffectiveTheme } from "./lib/theme";

// Initialize theme immediately before first paint (supports OS System default, Light, and Dark)
applyEffectiveTheme();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
