/**
 * Messages view - displays chat messages (Phase 4 - placeholder for now)
 */

import blessed from "blessed";
import type { Widgets } from "blessed";
import type { AppState, Message } from "../models/appState.js";
import { formatMessageTime } from "../utils/time.js";

export class MessagesView {
  public box: Widgets.BoxElement;
  private log: Widgets.Log;
  private inputBox: Widgets.TextboxElement;
  private appState: AppState;
  private onSendMessage?: (text: string) => void;

  constructor(parent: Widgets.Screen, appState: AppState) {
    this.appState = appState;

    // Create container box
    this.box = blessed.box({
      parent,
      top: 0,
      left: 0,
      width: "100%",
      height: "100%-2", // Leave room for status bar
      label: " 💬 Messages ",
      border: { type: "line" },
      style: {
        border: { fg: "cyan" },
        label: { fg: "cyan", bold: true },
      },
    });

    // Create message log
    this.log = blessed.log({
      parent: this.box,
      top: 0,
      left: 0,
      width: "100%",
      height: "100%-3", // Leave room for input
      tags: true,
      scrollable: true,
      alwaysScroll: true,
      scrollbar: {
        ch: "█",
        style: {
          fg: "cyan",
        },
      },
      mouse: true,
      keys: true,
      vi: true,
    });

    // Create input box
    this.inputBox = blessed.textbox({
      parent: this.box,
      bottom: 0,
      left: 0,
      width: "100%",
      height: 3,
      label: " Type message (Enter to send, Esc to cancel) ",
      border: { type: "line" },
      style: {
        border: { fg: "green" },
        focus: {
          border: { fg: "yellow" },
        },
      },
      inputOnFocus: true,
      keys: true,
      mouse: true,
    });

    // Handle input submission
    this.inputBox.on("submit", (value) => {
      if (value && value.trim()) {
        if (this.onSendMessage) {
          this.onSendMessage(value.trim());
        }
        this.inputBox.clearValue();
        this.inputBox.cancel();
      }
    });

    this.inputBox.on("cancel", () => {
      this.inputBox.clearValue();
      this.log.focus();
    });

    this.render();
  }

  /**
   * Set callback for when user sends a message
   */
  public setOnSendMessage(callback: (text: string) => void): void {
    this.onSendMessage = callback;
  }

  /**
   * Update the messages display
   */
  public render(): void {
    // Show recent messages (last 100)
    const recentMessages = this.appState.messages.slice(-100);

    // Clear and repopulate
    // Note: blessed.log doesn't have a clear method, so we work around it
    for (const msg of recentMessages) {
      this.addMessage(msg, false);
    }
  }

  /**
   * Add a single message to the log
   */
  public addMessage(message: Message, scroll: boolean = true): void {
    const time = formatMessageTime(message.timestamp);
    const fromName = message.fromName || `Node ${message.from}`;
    const toName =
      message.to === 0xffffffff
        ? "{yellow-fg}[Broadcast]{/}"
        : message.toName || `Node ${message.to}`;

    const line = `{cyan-fg}[${time}]{/} {green-fg}${fromName}{/} → ${toName}: ${message.text}`;

    this.log.log(line);

    if (scroll) {
      this.log.setScrollPerc(100);
    }
  }

  /**
   * Focus the input box for typing
   */
  public focus(): void {
    this.log.focus();
  }

  /**
   * Check if this view is focused
   */
  public hasFocus(): boolean {
    return (this.log as any).focused || (this.inputBox as any).focused || false;
  }

  /**
   * Start composing a message
   */
  public startCompose(): void {
    this.inputBox.focus();
  }
}
