/**
 * Application state management
 */

import * as Protobuf from "@meshtastic/protobufs";

/**
 * Extended node information with UI-specific fields
 */
export interface NodeState {
  num: number;
  user?: Protobuf.Mesh.User;
  position?: Protobuf.Mesh.Position;
  snr: number;
  lastHeard: number;
  deviceMetrics?: Protobuf.Telemetry.DeviceMetrics;
  channel: number;
  viaMqtt: boolean;
  hopsAway?: number;
  isFavorite: boolean;
  // UI-specific fields
  isOnline: boolean;
  lastSeenDate: Date;
}

/**
 * Message with metadata for display
 */
export interface Message {
  id: string;
  from: number;
  to: number;
  channel: number;
  text: string;
  timestamp: Date;
  fromName?: string;
  toName?: string;
}

/**
 * Main application state
 */
export interface AppState {
  // Connection
  isConnected: boolean;
  deviceHost: string;
  myNodeNum: number | null;

  // Node database
  nodes: Map<number, NodeState>;

  // Messages
  messages: Message[];

  // Channels
  channels: Protobuf.Channel.Channel[];

  // Device config
  config?: Protobuf.Config.Config;
  moduleConfig?: Protobuf.ModuleConfig.ModuleConfig;
}

/**
 * Create initial empty app state
 */
export function createInitialState(deviceHost: string): AppState {
  return {
    isConnected: false,
    deviceHost,
    myNodeNum: null,
    nodes: new Map(),
    messages: [],
    channels: [],
  };
}

/**
 * Helper to check if a node is online (heard in last 15 minutes)
 */
export function isNodeOnline(lastHeard: number): boolean {
  const fifteenMinutesAgo = Date.now() / 1000 - 15 * 60;
  return lastHeard > fifteenMinutesAgo;
}
