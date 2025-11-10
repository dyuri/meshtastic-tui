/**
 * Nodes view - displays list of mesh nodes in a table
 */

import blessed from "blessed";
import type { Widgets } from "blessed";
import type { AppState, NodeState } from "../models/appState.js";
import { formatRelativeTime } from "../utils/time.js";

export class NodesView {
  public box: Widgets.BoxElement;
  private table: Widgets.ListTableElement;
  private detailsBox: Widgets.BoxElement;
  private appState: AppState;

  constructor(parent: Widgets.Screen, appState: AppState) {
    this.appState = appState;

    // Create container box
    this.box = blessed.box({
      parent,
      top: 0,
      left: 0,
      width: "100%",
      height: "100%-2", // Leave room for status bar
      label: " 📡 Mesh Nodes ",
      border: { type: "line" },
      style: {
        border: { fg: "cyan" },
        label: { fg: "cyan", bold: true },
      },
    });

    // Create table for nodes list
    this.table = blessed.listtable({
      parent: this.box,
      top: 0,
      left: 0,
      width: "70%",
      height: "100%",
      keys: true,
      vi: true,
      mouse: true,
      tags: true,
      style: {
        header: {
          fg: "white",
          bold: true,
          bg: "blue",
        },
        cell: {
          fg: "white",
          selected: {
            bg: "blue",
            fg: "white",
          },
        },
      },
      align: "left",
    });

    // Create details box
    this.detailsBox = blessed.box({
      parent: this.box,
      top: 0,
      left: "70%",
      width: "30%",
      height: "100%",
      label: " Details ",
      border: { type: "line" },
      style: {
        border: { fg: "blue" },
      },
      padding: { left: 1, right: 1 },
      scrollable: true,
      alwaysScroll: true,
      scrollbar: {
        ch: "█",
        style: {
          fg: "blue",
        },
      },
      tags: true,
    });

    // Handle selection changes
    this.table.on("select", (item) => {
      this.updateDetails();
    });

    this.render();
  }

  /**
   * Update the nodes table with current data
   */
  public render(): void {
    const nodes = Array.from(this.appState.nodes.values());

    // Sort by last heard (most recent first)
    nodes.sort((a, b) => b.lastHeard - a.lastHeard);

    // Build table data
    const tableData: string[][] = [
      ["Status", "Name", "ID", "SNR", "Last Heard", "Hops"],
    ];

    for (const node of nodes) {
      const status = node.isOnline ? "{green-fg}●{/}" : "{red-fg}●{/}";
      const name = node.user?.longName || `Node ${node.num}`;
      const id = node.user?.shortName || node.num.toString();
      const snr = node.snr ? `${node.snr.toFixed(1)} dB` : "N/A";
      const lastHeard = formatRelativeTime(node.lastHeard);
      const hops = node.hopsAway !== undefined ? node.hopsAway.toString() : "?";

      tableData.push([status, name, id, snr, lastHeard, hops]);
    }

    this.table.setData(tableData);
    this.updateDetails();
  }

  /**
   * Update the details panel with selected node info
   */
  private updateDetails(): void {
    const selected = (this.table as any).selected;
    if (selected === undefined || selected <= 0) {
      this.detailsBox.setContent("{center}Select a node to view details{/center}");
      return;
    }

    const nodes = Array.from(this.appState.nodes.values());
    nodes.sort((a, b) => b.lastHeard - a.lastHeard);

    const node = nodes[selected - 1]; // -1 because first row is header
    if (!node) {
      this.detailsBox.setContent("{center}No node selected{/center}");
      return;
    }

    let content = "";

    // Basic info
    content += `{bold}${node.user?.longName || "Unknown"}{/bold}\n`;
    content += `{cyan-fg}━━━━━━━━━━━━━━━━━{/}\n\n`;

    // User info
    if (node.user) {
      content += `{bold}User Info:{/bold}\n`;
      content += `  Short: ${node.user.shortName}\n`;
      content += `  MAC: ${node.user.macaddr || "N/A"}\n`;
      content += `  HW: ${node.user.hwModel || "N/A"}\n`;
      content += `\n`;
    }

    // Node info
    content += `{bold}Node Info:{/bold}\n`;
    content += `  ID: ${node.num}\n`;
    content += `  Status: ${node.isOnline ? "{green-fg}Online{/}" : "{red-fg}Offline{/}"}\n`;
    content += `  SNR: ${node.snr ? node.snr.toFixed(1) : "N/A"} dB\n`;
    content += `  Channel: ${node.channel}\n`;
    content += `  Via MQTT: ${node.viaMqtt ? "Yes" : "No"}\n`;
    if (node.hopsAway !== undefined) {
      content += `  Hops Away: ${node.hopsAway}\n`;
    }
    content += `\n`;

    // Time info
    content += `{bold}Time:{/bold}\n`;
    content += `  Last Heard: ${formatRelativeTime(node.lastHeard)}\n`;
    content += `  Timestamp: ${node.lastSeenDate.toLocaleString()}\n`;
    content += `\n`;

    // Position
    if (node.position) {
      content += `{bold}Position:{/bold}\n`;
      content += `  Lat: ${node.position.latitude?.toFixed(6) || "N/A"}\n`;
      content += `  Lon: ${node.position.longitude?.toFixed(6) || "N/A"}\n`;
      if (node.position.altitude) {
        content += `  Alt: ${node.position.altitude}m\n`;
      }
      content += `\n`;
    }

    // Device metrics
    if (node.deviceMetrics) {
      content += `{bold}Device Metrics:{/bold}\n`;
      if (node.deviceMetrics.batteryLevel !== undefined) {
        content += `  Battery: ${node.deviceMetrics.batteryLevel}%\n`;
      }
      if (node.deviceMetrics.voltage !== undefined) {
        content += `  Voltage: ${node.deviceMetrics.voltage.toFixed(2)}V\n`;
      }
      if (node.deviceMetrics.channelUtilization !== undefined) {
        content += `  Ch Util: ${node.deviceMetrics.channelUtilization.toFixed(1)}%\n`;
      }
      if (node.deviceMetrics.airUtilTx !== undefined) {
        content += `  Air Util TX: ${node.deviceMetrics.airUtilTx.toFixed(1)}%\n`;
      }
      content += `\n`;
    }

    this.detailsBox.setContent(content);
  }

  /**
   * Focus the table for keyboard input
   */
  public focus(): void {
    this.table.focus();
  }

  /**
   * Check if this view is focused
   */
  public hasFocus(): boolean {
    return (this.table as any).focused || false;
  }
}
