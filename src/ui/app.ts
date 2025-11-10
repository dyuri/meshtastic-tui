/**
 * Main TUI Application
 */

import blessed from "blessed";
import type { Widgets } from "blessed";
import { DeviceManager } from "../client/deviceManager.js";
import type { AppState } from "../models/appState.js";
import { NodesView } from "./nodesView.js";
import { MessagesView } from "./messagesView.js";
import { StatusBar } from "./statusBar.js";

export type ViewType = "nodes" | "messages";

export class TUIApp {
  private screen: Widgets.Screen;
  private deviceManager: DeviceManager;
  private appState: AppState;

  // Views
  private nodesView: NodesView;
  private messagesView: MessagesView;
  private statusBar: StatusBar;

  // Current view
  private currentView: ViewType = "nodes";

  // Update interval for status bar
  private updateInterval?: NodeJS.Timeout;

  constructor(deviceManager: DeviceManager, appState: AppState) {
    this.deviceManager = deviceManager;
    this.appState = appState;

    // Create screen
    this.screen = blessed.screen({
      smartCSR: true,
      title: "Meshtastic TUI",
      fullUnicode: true,
    });

    // Create views
    this.nodesView = new NodesView(this.screen, appState);
    this.messagesView = new MessagesView(this.screen, appState);
    this.statusBar = new StatusBar(this.screen, appState);

    // Initially hide messages view
    this.messagesView.box.hide();

    // Set up keyboard handlers
    this.setupKeyHandlers();

    // Set up device event handlers
    this.setupDeviceHandlers();

    // Set up message sending
    this.messagesView.setOnSendMessage(async (text) => {
      try {
        // Send to broadcast by default (0xffffffff)
        // TODO: Add destination selection UI
        await this.deviceManager.sendText(text, 0xffffffff, 0);
        this.showNotification("Message sent!", "green");
      } catch (error) {
        this.showNotification(`Error: ${error}`, "red");
      }
    });

    // Start periodic updates
    this.startPeriodicUpdates();

    // Initial render
    this.render();
  }

  /**
   * Set up keyboard event handlers
   */
  private setupKeyHandlers(): void {
    // Quit
    this.screen.key(["q", "Q", "C-c"], async () => {
      await this.cleanup();
      process.exit(0);
    });

    // Switch views
    this.screen.key(["tab"], () => {
      this.switchView();
    });

    // View-specific shortcuts
    this.screen.key(["1"], () => {
      this.setView("nodes");
    });

    this.screen.key(["2"], () => {
      this.setView("messages");
    });

    // Compose message (when in messages view)
    this.screen.key(["c", "C"], () => {
      if (this.currentView === "messages") {
        this.messagesView.startCompose();
      }
    });

    // Refresh
    this.screen.key(["r", "R"], () => {
      this.render();
      this.showNotification("Refreshed", "cyan");
    });

    // Help
    this.screen.key(["?", "h", "H"], () => {
      this.showHelp();
    });
  }

  /**
   * Set up device event handlers
   */
  private setupDeviceHandlers(): void {
    // Update UI when nodes change
    this.deviceManager.on("nodeInfo", () => {
      this.render();
    });

    // Update UI when messages arrive
    this.deviceManager.on("message", (message: any) => {
      this.messagesView.addMessage(message);
      this.render();
    });

    // Update UI on my node info
    this.deviceManager.on("myNodeInfo", () => {
      this.showNotification("Connected to mesh!", "green");
      this.render();
    });
  }

  /**
   * Switch between views
   */
  private switchView(): void {
    if (this.currentView === "nodes") {
      this.setView("messages");
    } else {
      this.setView("nodes");
    }
  }

  /**
   * Set the current view
   */
  private setView(view: ViewType): void {
    this.currentView = view;

    if (view === "nodes") {
      this.messagesView.box.hide();
      this.nodesView.box.show();
      this.nodesView.focus();
    } else {
      this.nodesView.box.hide();
      this.messagesView.box.show();
      this.messagesView.focus();
    }

    this.render();
  }

  /**
   * Show a notification message
   */
  private showNotification(message: string, color: string = "yellow"): void {
    const notif = blessed.message({
      parent: this.screen,
      top: "center",
      left: "center",
      width: "50%",
      height: "shrink",
      align: "center",
      valign: "middle",
      tags: true,
      border: { type: "line" },
      style: {
        border: { fg: color },
        bg: "black",
      },
    });

    notif.display(`{${color}-fg}${message}{/}`, 2, () => {
      this.screen.render();
    });
  }

  /**
   * Show help dialog
   */
  private showHelp(): void {
    const help = blessed.box({
      parent: this.screen,
      top: "center",
      left: "center",
      width: "60%",
      height: "60%",
      tags: true,
      border: { type: "line" },
      label: " Help ",
      style: {
        border: { fg: "cyan" },
        label: { fg: "cyan", bold: true },
      },
      padding: { left: 2, right: 2 },
      scrollable: true,
      alwaysScroll: true,
      keys: true,
      vi: true,
      mouse: true,
    });

    const content = `
{bold}{cyan-fg}Keyboard Shortcuts:{/}{/}

{bold}Navigation:{/}
  Tab          Switch between views
  1            Go to Nodes view
  2            Go to Messages view
  ↑/↓          Navigate lists
  Page Up/Down Scroll pages

{bold}Actions:{/}
  C            Compose message (Messages view)
  Enter        Send message / Select item
  Esc          Cancel input
  R            Refresh display

{bold}General:{/}
  ?/H          Show this help
  Q            Quit application
  Ctrl+C       Quit application

{bold}Views:{/}
  {bold}Nodes{/}       - View mesh network nodes
  {bold}Messages{/}    - Send and receive messages

{center}{dim}Press any key to close{/}{/center}
`;

    help.setContent(content);

    help.key(["escape", "q", "enter", "space"], () => {
      help.destroy();
      this.screen.render();
    });

    help.focus();
    this.screen.render();
  }

  /**
   * Start periodic updates (for relative times, etc.)
   */
  private startPeriodicUpdates(): void {
    // Update every 10 seconds
    this.updateInterval = setInterval(() => {
      this.render();
    }, 10000);
  }

  /**
   * Render all views
   */
  public render(): void {
    this.nodesView.render();
    this.messagesView.render();
    this.statusBar.render();
    this.screen.render();
  }

  /**
   * Clean up resources
   */
  private async cleanup(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    await this.deviceManager.disconnect();
  }

  /**
   * Run the application
   */
  public run(): void {
    this.render();
  }
}
