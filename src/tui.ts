#!/usr/bin/env node

/**
 * Meshtastic TUI - Main Entry Point (TUI Version)
 *
 * A terminal user interface for Meshtastic mesh networking devices
 */

import { DeviceManager } from "./client/deviceManager.js";
import { createInitialState } from "./models/appState.js";
import { TUIApp } from "./ui/app.js";

const DEVICE_HOST = process.env.MESHTASTIC_HOST || "10.10.0.57";

async function main() {
  console.log("Meshtastic TUI - Connecting...");
  console.log(`Device: ${DEVICE_HOST}`);
  console.log("(Press Ctrl+C to cancel)\n");

  // Create app state
  const appState = createInitialState(DEVICE_HOST);

  // Create device manager
  const deviceManager = new DeviceManager(appState);

  try {
    // Connect to device
    await deviceManager.connect(DEVICE_HOST);
    console.log("Connected! Starting TUI...\n");

    // Small delay to let initial data flow
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Create and run TUI
    const app = new TUIApp(deviceManager, appState);
    app.run();
  } catch (error) {
    console.error("\n❌ Connection failed:");
    console.error(error);
    console.error(`\nTroubleshooting:`);
    console.error(`  • Verify device is accessible at http://${DEVICE_HOST}`);
    console.error(`  • Check that HTTP server is enabled on the device`);
    console.error(`  • Try: MESHTASTIC_HOST=<ip> npm run tui`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
