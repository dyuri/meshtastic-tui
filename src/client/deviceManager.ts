/**
 * Device Manager - Wraps MeshDevice with application-specific logic
 */

import { MeshDevice } from "@meshtastic/core";
import { TransportHTTP } from "@meshtastic/transport-http";
import type { Protobuf } from "@meshtastic/protobufs";
import type { AppState, NodeState, Message } from "../models/appState.js";
import { isNodeOnline } from "../models/appState.js";

/**
 * Manages connection to Meshtastic device and synchronizes state
 */
export class DeviceManager {
  private device: MeshDevice | null = null;
  private transport: TransportHTTP | null = null;
  private appState: AppState;
  private eventCallbacks: Map<string, Set<Function>> = new Map();

  constructor(appState: AppState) {
    this.appState = appState;
  }

  /**
   * Connect to a Meshtastic device
   */
  async connect(host: string): Promise<void> {
    this.transport = await TransportHTTP.create(host);
    this.device = new MeshDevice(this.transport);

    this.setupEventListeners();
    this.appState.isConnected = true;
    this.appState.deviceHost = host;
  }

  /**
   * Disconnect from device
   */
  async disconnect(): Promise<void> {
    if (this.device) {
      await this.device.disconnect();
      this.device = null;
      this.transport = null;
      this.appState.isConnected = false;
    }
  }

  /**
   * Send a text message
   */
  async sendText(text: string, destination: number, channel: number = 0): Promise<void> {
    if (!this.device) {
      throw new Error("Not connected to device");
    }
    await this.device.sendText(text, destination, channel);
  }

  /**
   * Get current device instance (for advanced usage)
   */
  getDevice(): MeshDevice | null {
    return this.device;
  }

  /**
   * Set up event listeners for device events
   */
  private setupEventListeners(): void {
    if (!this.device) return;

    // My node info
    this.device.events.onMyNodeInfo.subscribe((myInfo) => {
      this.appState.myNodeNum = myInfo.myNodeNum;
      this.emit('myNodeInfo', myInfo);
    });

    // Node info updates
    this.device.events.onNodeInfoPacket.subscribe((nodeInfo) => {
      this.updateNode(nodeInfo);
      this.emit('nodeInfo', nodeInfo);
    });

    // User updates
    this.device.events.onUserPacket.subscribe((user) => {
      // Find node with matching MAC address and update
      for (const [nodeNum, node] of this.appState.nodes.entries()) {
        if (node.user?.macaddr === user.macaddr) {
          node.user = user;
          this.appState.nodes.set(nodeNum, node);
          break;
        }
      }
      this.emit('user', user);
    });

    // Position updates
    this.device.events.onPositionPacket.subscribe((position) => {
      // Update position for nodes - position updates don't include node number
      // so we need to track which node sent it
      this.emit('position', position);
    });

    // Text messages
    this.device.events.onMessagePacket.subscribe((packet) => {
      const message: Message = {
        id: `${packet.from}-${packet.to}-${Date.now()}`,
        from: packet.from,
        to: packet.to,
        channel: packet.channel,
        text: packet.text || "",
        timestamp: new Date(),
        fromName: this.appState.nodes.get(packet.from)?.user?.longName,
        toName: this.appState.nodes.get(packet.to)?.user?.longName,
      };

      this.appState.messages.push(message);
      this.emit('message', message);
    });

    // Config complete
    this.device.events.onConfigComplete.subscribe(() => {
      this.emit('configComplete');
    });

    // Device status
    this.device.events.onDeviceStatus.subscribe((status) => {
      this.emit('deviceStatus', status);
    });

    // Channel updates
    this.device.events.onChannelPacket.subscribe((channel) => {
      const existingIndex = this.appState.channels.findIndex(
        (c) => c.index === channel.index
      );

      if (existingIndex >= 0) {
        this.appState.channels[existingIndex] = channel;
      } else {
        this.appState.channels.push(channel);
      }

      this.emit('channel', channel);
    });

    // Config updates
    this.device.events.onConfigPacket.subscribe((config) => {
      this.appState.config = config;
      this.emit('config', config);
    });

    // Module config updates
    this.device.events.onModuleConfigPacket.subscribe((moduleConfig) => {
      this.appState.moduleConfig = moduleConfig;
      this.emit('moduleConfig', moduleConfig);
    });
  }

  /**
   * Update node in state
   */
  private updateNode(nodeInfo: Protobuf.Mesh.NodeInfo): void {
    const existing = this.appState.nodes.get(nodeInfo.num);

    const nodeState: NodeState = {
      ...existing,
      num: nodeInfo.num,
      user: nodeInfo.user || existing?.user,
      position: nodeInfo.position || existing?.position,
      snr: nodeInfo.snr,
      lastHeard: nodeInfo.lastHeard,
      deviceMetrics: nodeInfo.deviceMetrics || existing?.deviceMetrics,
      channel: nodeInfo.channel,
      viaMqtt: nodeInfo.viaMqtt,
      hopsAway: nodeInfo.hopsAway,
      isFavorite: nodeInfo.isFavorite,
      isOnline: isNodeOnline(nodeInfo.lastHeard),
      lastSeenDate: new Date(nodeInfo.lastHeard * 1000),
    };

    this.appState.nodes.set(nodeInfo.num, nodeState);
  }

  /**
   * Register event callback
   */
  on(event: string, callback: Function): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set());
    }
    this.eventCallbacks.get(event)!.add(callback);
  }

  /**
   * Unregister event callback
   */
  off(event: string, callback: Function): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emit event to registered callbacks
   */
  private emit(event: string, data?: any): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error);
        }
      }
    }
  }
}
