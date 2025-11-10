#!/usr/bin/env node

/**
 * Meshtastic TUI - Main Entry Point
 *
 * A terminal user interface for Meshtastic mesh networking devices
 */

import { DeviceManager } from "./client/deviceManager.js";
import { createInitialState } from "./models/appState.js";
import { formatRelativeTime } from "./utils/time.js";

const DEVICE_HOST = process.env.MESHTASTIC_HOST || "10.10.0.57";

async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║           Meshtastic TUI v1.0.0                      ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  console.log(`Connecting to device at ${DEVICE_HOST}...`);

  // Create app state
  const appState = createInitialState(DEVICE_HOST);

  // Create device manager
  const deviceManager = new DeviceManager(appState);

  try {
    // Connect to device
    await deviceManager.connect(DEVICE_HOST);
    console.log("✓ Connected!\n");

    // Set up event listeners
    deviceManager.on('myNodeInfo', (myInfo) => {
      console.log(`\n[MY NODE] Node #${myInfo.myNodeNum}`);
      console.log(`  Reboot count: ${myInfo.rebootCount}`);
      console.log(`  Max channels: ${myInfo.maxChannels}`);
    });

    deviceManager.on('nodeInfo', (nodeInfo) => {
      const node = appState.nodes.get(nodeInfo.num);
      if (!node) return;

      console.log(`\n[NODE UPDATE] ${node.user?.longName || `Node ${node.num}`}`);
      console.log(`  ID: ${node.num}`);
      console.log(`  Short name: ${node.user?.shortName || 'N/A'}`);
      console.log(`  HW Model: ${node.user?.hwModel || 'N/A'}`);
      console.log(`  SNR: ${node.snr} dB`);
      console.log(`  Last heard: ${formatRelativeTime(node.lastHeard)}`);
      console.log(`  Status: ${node.isOnline ? '🟢 Online' : '🔴 Offline'}`);

      if (node.position) {
        console.log(`  Position: ${node.position.latitude.toFixed(6)}, ${node.position.longitude.toFixed(6)}`);
        if (node.position.altitude) {
          console.log(`  Altitude: ${node.position.altitude}m`);
        }
      }

      if (node.hopsAway !== undefined) {
        console.log(`  Hops away: ${node.hopsAway}`);
      }
    });

    deviceManager.on('message', (message) => {
      const fromNode = appState.nodes.get(message.from);
      const toNode = appState.nodes.get(message.to);

      console.log(`\n[💬 MESSAGE]`);
      console.log(`  From: ${message.fromName || fromNode?.user?.shortName || message.from}`);
      console.log(`  To: ${message.toName || toNode?.user?.shortName || message.to}`);
      console.log(`  Channel: ${message.channel}`);
      console.log(`  Text: "${message.text}"`);
      console.log(`  Time: ${message.timestamp.toLocaleTimeString()}`);
    });

    deviceManager.on('configComplete', () => {
      console.log(`\n✓ Initial configuration sync complete!`);
      console.log(`\n📊 Network Status:`);
      console.log(`  Total nodes: ${appState.nodes.size}`);
      console.log(`  Online nodes: ${Array.from(appState.nodes.values()).filter(n => n.isOnline).length}`);
      console.log(`  Channels: ${appState.channels.length}`);
      console.log(`  Messages: ${appState.messages.length}`);
      console.log(`\nListening for updates... (Press Ctrl+C to exit)\n`);
    });

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\nDisconnecting from device...');
      await deviceManager.disconnect();
      console.log('Goodbye!');
      process.exit(0);
    });

    // Keep process alive
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(`\nTroubleshooting:`);
    console.error(`  • Verify device is accessible at http://${DEVICE_HOST}`);
    console.error(`  • Check that HTTP server is enabled on the device`);
    console.error(`  • Try a different IP with: MESHTASTIC_HOST=<ip> npm run dev`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
