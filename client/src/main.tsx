import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add Inter font
const interFontLink = document.createElement("link");
interFontLink.rel = "stylesheet";
interFontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap";
document.head.appendChild(interFontLink);

// Add page title and meta description
const titleTag = document.createElement("title");
titleTag.textContent = "BucketList - Track Your Life Goals";
document.head.appendChild(titleTag);

const metaDescription = document.createElement("meta");
metaDescription.name = "description";
metaDescription.content = "Create, track, and achieve your bucket list goals with our comprehensive bucket list tracking application.";
document.head.appendChild(metaDescription);

createRoot(document.getElementById("root")!).render(<App />);
