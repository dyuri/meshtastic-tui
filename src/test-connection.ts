#!/usr/bin/env tsx

/**
 * Test script to verify connection to Meshtastic device via HTTP
 *
 * Usage: npm run test:connection
 *
 * This will attempt to connect to a device at the IP address specified
 * in the MESHTASTIC_HOST environment variable (default: 10.10.0.57)
 */

import { MeshDevice } from "@meshtastic/core";
import { TransportHTTP } from "@meshtastic/transport-http";

// Device IP address - can be overridden with environment variable
const DEVICE_HOST = process.env.MESHTASTIC_HOST || "10.10.0.57";

async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║   Meshtastic TUI - Connection Test                  ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  console.log(`Attempting to connect to device at: ${DEVICE_HOST}...`);

  try {
    // Create HTTP transport
    const transport = await TransportHTTP.create(DEVICE_HOST);
    console.log("✓ HTTP transport created");

    // Create MeshDevice instance
    const device = new MeshDevice(transport);
    console.log("✓ MeshDevice instance created\n");

    console.log("Setting up event listeners...\n");

    // Listen for node info updates
    device.events.onNodeInfoPacket.subscribe((nodeInfo: any) => {
      console.log(`\n[NODE INFO]`);
      console.log(`  Node ID: ${nodeInfo.num}`);
      if (nodeInfo.user) {
        console.log(`  Long Name: ${nodeInfo.user.longName}`);
        console.log(`  Short Name: ${nodeInfo.user.shortName}`);
        console.log(`  HW Model: ${nodeInfo.user.hwModel}`);
      }
      if (nodeInfo.position) {
        console.log(`  Position: lat=${nodeInfo.position.latitude}, lon=${nodeInfo.position.longitude}`);
      }
      console.log(`  SNR: ${nodeInfo.snr}`);
      console.log(`  Last Heard: ${new Date(nodeInfo.lastHeard * 1000).toLocaleString()}`);
    });

    // Listen for user packet updates
    device.events.onUserPacket.subscribe((packet: any) => {
      const user = packet.data;
      console.log(`\n[USER UPDATE]`);
      console.log(`  ${user.longName} (${user.shortName})`);
      console.log(`  MAC: ${user.macaddr}`);
    });

    // Listen for position updates
    device.events.onPositionPacket.subscribe((packet: any) => {
      const position = packet.data;
      console.log(`\n[POSITION UPDATE]`);
      console.log(`  Lat: ${position.latitude}, Lon: ${position.longitude}`);
      console.log(`  Altitude: ${position.altitude}m`);
    });

    // Listen for text messages
    device.events.onMessagePacket.subscribe((packet: any) => {
      console.log(`\n[MESSAGE]`);
      console.log(`  From: ${packet.from}`);
      console.log(`  To: ${packet.to}`);
      console.log(`  Text: ${packet.data}`);
      console.log(`  Channel: ${packet.channel}`);
    });

    // Listen for my node info
    device.events.onMyNodeInfo.subscribe((myInfo: any) => {
      console.log(`\n[MY NODE INFO]`);
      console.log(`  My Node Number: ${myInfo.myNodeNum}`);
      console.log(`  Max Channels: ${myInfo.maxChannels}`);
      console.log(`  Reboot Count: ${myInfo.rebootCount}`);
      console.log(`\n✓ Initial configuration sync in progress...`);
      console.log(`\nListening for updates... (Press Ctrl+C to exit)`);
    });

    console.log("Connected! Waiting for data from device...");
    console.log("(This may take a few seconds)\n");

    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\n\nDisconnecting...');
      await device.disconnect();
      console.log('Goodbye!');
      process.exit(0);
    });

  } catch (error) {
    console.error("\n❌ Connection failed:");
    console.error(error);
    console.error(`\nMake sure:`);
    console.error(`  1. A Meshtastic device is accessible at ${DEVICE_HOST}`);
    console.error(`  2. The device has HTTP server enabled`);
    console.error(`  3. You can access the device in your web browser at http://${DEVICE_HOST}`);
    console.error(`\nTo use a different IP, set the MESHTASTIC_HOST environment variable:`);
    console.error(`  MESHTASTIC_HOST=192.168.1.100 npm run test:connection`);
    process.exit(1);
  }
}

main();
