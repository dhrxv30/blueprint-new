import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Note: Requestly SessionBook/Recording is best handled via the browser extension for this demo.
// The previous CDN script was causing DNS resolve errors.

createRoot(document.getElementById("root")!).render(<App />);
