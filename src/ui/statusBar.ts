/**
 * Status bar - displays connection status and stats at the bottom
 */

import blessed from "blessed";
import type { Widgets } from "blessed";
import type { AppState } from "../models/appState.js";

export class StatusBar {
  private box: Widgets.BoxElement;
  private appState: AppState;

  constructor(parent: Widgets.Screen, appState: AppState) {
    this.appState = appState;

    this.box = blessed.box({
      parent,
      bottom: 0,
      left: 0,
      width: "100%",
      height: 2,
      tags: true,
      style: {
        fg: "white",
        bg: "blue",
      },
    });

    this.render();
  }

  /**
   * Update status bar content
   */
  public render(): void {
    const connStatus = this.appState.isConnected
      ? "{green-fg}{bold}●{/bold}{/} Connected"
      : "{red-fg}{bold}●{/bold}{/} Disconnected";

    const host = this.appState.deviceHost;
    const nodeCount = this.appState.nodes.size;
    const onlineCount = Array.from(this.appState.nodes.values()).filter(
      (n) => n.isOnline
    ).length;
    const messageCount = this.appState.messages.length;
    const myNode = this.appState.myNodeNum
      ? ` │ My Node: ${this.appState.myNodeNum}`
      : "";

    const leftContent = ` ${connStatus} │ ${host}${myNode}`;
    const rightContent = `Nodes: ${onlineCount}/${nodeCount} │ Messages: ${messageCount} │ [Tab] Switch │ [Q]uit `;

    // Calculate padding to right-align
    const leftLen = this.stripTags(leftContent).length;
    const rightLen = this.stripTags(rightContent).length;
    const totalWidth = this.box.width as number;
    const padding = " ".repeat(Math.max(0, totalWidth - leftLen - rightLen));

    this.box.setContent(`${leftContent}${padding}${rightContent}`);
  }

  /**
   * Strip blessed tags from string to get actual length
   */
  private stripTags(str: string): string {
    return str.replace(/\{[^}]*\}/g, "");
  }
}
