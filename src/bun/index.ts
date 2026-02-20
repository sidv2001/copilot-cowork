/**
 * Copilot Cowork - Electrobun Main Process
 *
 * This is the main bun process that creates the desktop window
 * and loads the Next.js frontend (dev server or static export).
 */
import { BrowserWindow, ApplicationMenu } from "electrobun/bun";

// COPILOT_COWORK_DEV_SERVER=1 is set by the `dev` script when
// the Next.js dev server is actually running on localhost:3000.
// Otherwise (including `bun start`), use the bundled static export.
const useDevServer = process.env.COPILOT_COWORK_DEV_SERVER === "1";

const appUrl = useDevServer
  ? "http://localhost:3000"
  : "views://main-ui/index.html";

// Set up the application menu with standard Edit shortcuts
ApplicationMenu.setApplicationMenu([
  {
    submenu: [{ label: "Quit", role: "quit" }],
  },
  {
    label: "Edit",
    submenu: [
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      { role: "pasteAndMatchStyle" },
      { role: "delete" },
      { role: "selectAll" },
    ],
  },
]);

// Create the main browser window
const mainWindow = new BrowserWindow({
  title: "Copilot Cowork",
  url: appUrl,
  frame: {
    x: 0,
    y: 0,
    width: 1280,
    height: 820,
  },
});

console.log(`[Copilot Cowork] App started in ${useDevServer ? "development" : "production"} mode`);
console.log(`[Copilot Cowork] Loading: ${appUrl}`);
