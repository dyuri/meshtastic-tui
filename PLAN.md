# Meshtastic TUI Client - Implementation Plan

## Analysis Summary

After analyzing the [Meshtastic web client](https://github.com/meshtastic/web), here's what I found:

### Architecture Overview

The web client uses a modular TypeScript/JavaScript architecture:

1. **@meshtastic/core** - Core library providing the `MeshDevice` class
2. **@meshtastic/transport-http** - HTTP transport layer for device communication
3. **@meshtastic/protobufs** - Protocol Buffer definitions (shared with device firmware)
4. **@meshtastic/web** - React-based web interface

### HTTP Communication Protocol

The Meshtastic HTTP API is simple and efficient:

#### Endpoints
- `GET /api/v1/fromradio` - Retrieve messages from device (returns FromRadio protobufs)
- `PUT /api/v1/toradio` - Send messages to device (accepts ToRadio protobufs)

#### Connection Flow
1. Send `ToRadio.startConfig` to initialize connection and request full NodeDB
2. Read `FromRadio` messages repeatedly to receive:
   - `my_info` - Your node information
   - `node_info` - Database entries for all known nodes
   - `config` - Device configuration
   - `channel` - Channel settings
   - `config_complete_id` - Signals initial sync is complete
3. Poll `/api/v1/fromradio` for ongoing updates
4. Send messages via `ToRadio.packet` with `MeshPacket` payloads

#### Key Data Structures

**FromRadio variants:**
- `packet` - MeshPacket (messages, telemetry, etc.)
- `my_info` - Your node's info (MyNodeInfo)
- `node_info` - Other nodes in the mesh (NodeInfo)
- `config` - Device configuration
- `moduleConfig` - Module-specific settings
- `channel` - Channel configuration
- `log_record` - Debug logs
- `queueStatus` - Message queue status
- `clientNotification` - User notifications

**ToRadio variants:**
- `packet` - Send MeshPacket
- `want_config_id` - Request config sync
- `disconnect` - Clean disconnection
- `heartbeat` - Keep connection alive

**NodeInfo structure:**
- `num` - Node number (ID)
- `user` - User info (longName, shortName, macaddr, hwModel)
- `position` - GPS coordinates
- `snr` - Signal-to-noise ratio
- `lastHeard` - Timestamp
- `deviceMetrics` - Battery, voltage, etc.
- `hopsAway` - Distance in hops
- `viaMqtt` - If heard via MQTT

### Web Client Features

The web client has 5 main pages:
1. **Connections** - Manage device connections (HTTP/Serial/Bluetooth)
2. **Map** - Geographic visualization of nodes
3. **Nodes** - List of mesh nodes with details
4. **Messages** - Send/receive text messages
5. **Settings** - Configure device and app

---

## TUI Client Implementation Plan

### Technology Stack Recommendation

**Language: TypeScript/Node.js** ⭐ **RECOMMENDED**

**Why TypeScript:**
- 🎯 **Use official Meshtastic libraries** - No need to reimplement protocol!
- `@meshtastic/core` - Already has MeshDevice class
- `@meshtastic/transport-http` - HTTP transport already implemented
- `@meshtastic/protobufs` - Protobuf definitions already compiled
- Type safety and excellent tooling
- Large ecosystem and community

**Core Dependencies:**
- `@meshtastic/core` - Device interaction (official)
- `@meshtastic/transport-http` - HTTP transport (official)
- `@meshtastic/protobufs` - Protocol definitions (official)
- **TUI Library** - Choose one:
  - **`blessed`** - Traditional, feature-rich, widget-based ⭐ Recommended for complex UIs
  - **`ink`** - React-based, modern, declarative (good if you know React)
- `blessed-contrib` - Additional widgets (graphs, maps, etc.)
- `typescript` - Type system

**Alternative 1: Rust**
- `ratatui` + `crossterm` - Excellent TUI
- BUT: Must reimplement entire protocol, protobuf parsing, HTTP transport
- Good for: Performance-critical applications, learning exercise

**Alternative 2: Python**
- `textual` - Modern TUI framework
- BUT: Must reimplement protocol or use Python Meshtastic library (CLI-focused)
- Good for: Rapid prototyping

### Architecture (TypeScript)

```
meshtastic-tui/
├── src/
│   ├── index.ts            # Entry point
│   ├── app.ts              # Main application class
│   ├── ui/                 # UI components
│   │   ├── index.ts
│   │   ├── layout.ts       # Main layout manager
│   │   ├── nodes.ts        # Nodes list view
│   │   ├── messages.ts     # Messages view
│   │   ├── map.ts          # ASCII/text map view
│   │   ├── config.ts       # Configuration view
│   │   └── statusBar.ts    # Status bar
│   ├── client/             # Device client wrapper
│   │   ├── index.ts
│   │   ├── deviceManager.ts # Manages MeshDevice instance
│   │   └── eventHandler.ts  # Handle device events
│   ├── models/             # Data models
│   │   ├── appState.ts     # Application state
│   │   ├── node.ts         # Node information
│   │   └── message.ts      # Message types
│   └── utils/              # Utilities
│       ├── time.ts         # Time formatting
│       └── logger.ts       # Logging
├── package.json
├── tsconfig.json
└── README.md
```

**Key advantage:** No `client/transport.ts` or `proto/` directory needed - just import from npm!

### Implementation Phases

#### Phase 1: Foundation (Day 1-2) ⚡ Much Faster!
**Goal:** Basic HTTP connection using official libraries

Tasks:
1. Initialize TypeScript/Node.js project:
   ```bash
   npm init -y
   npm install @meshtastic/core @meshtastic/transport-http @meshtastic/protobufs
   npm install --save-dev typescript @types/node ts-node
   ```
2. Create basic device connection:
   ```typescript
   import { MeshDevice } from "@meshtastic/core";
   import { TransportHTTP } from "@meshtastic/transport-http";

   const transport = await TransportHTTP.create("10.10.0.57");
   const device = new MeshDevice(transport);
   ```
3. Set up event listeners for device events
4. Test connection with real device
5. Print received messages to console

**Deliverables:**
- Working HTTP client using official libraries (WAY faster than reimplementing!)
- Console output showing node info and messages

**Time saved:** Days of protobuf/HTTP implementation work!

#### Phase 2: Data Models & State Management (Day 2-3)
**Goal:** Maintain synchronized state with device

Tasks:
1. Create TypeScript interfaces extending Meshtastic types:
   ```typescript
   import { Protobuf } from "@meshtastic/protobufs";

   interface NodeState extends Protobuf.Mesh.NodeInfo {
     lastSeen: Date;
     isOnline: boolean;
   }

   interface AppState {
     nodes: Map<number, NodeState>;
     messages: Message[];
     myNodeId: number | null;
     isConnected: boolean;
   }
   ```
2. Implement event handlers for MeshDevice events:
   - `onNodeInfoPacket` - Update node database
   - `onUserPacket` - Update user info
   - `onPositionPacket` - Update positions
   - `onMessagePacket` - Add to message history
3. State manager class to centralize updates

**Deliverables:**
- Type-safe state management
- Event-driven updates
- In-memory node database

#### Phase 3: Basic TUI (Day 3-5)
**Goal:** Simple working interface with Blessed

Tasks:
1. Install TUI dependencies:
   ```bash
   npm install blessed @types/blessed
   npm install blessed-contrib  # Optional: for advanced widgets
   ```
2. Create basic blessed layout:
   ```typescript
   import blessed from 'blessed';

   const screen = blessed.screen({ smartCSR: true });
   const layout = blessed.layout({ /* ... */ });
   ```
3. Implement "Nodes" view:
   - `blessed.listtable` for nodes with columns
   - Node details box (when selected)
   - Real-time updates from device events
4. Add keyboard bindings (arrow keys, tab, q to quit)
5. Status bar showing connection state

**Deliverables:**
- Working TUI with nodes list
- Keyboard navigation
- Real-time updates

#### Phase 4: Messages View (Day 5-7)
**Goal:** Send and receive messages

Tasks:
1. Implement "Messages" view:
   - `blessed.log` or `blessed.list` for message history
   - `blessed.textbox` for input at bottom
   - Channel selector
2. Message sending using MeshDevice:
   ```typescript
   device.sendText(messageText, destinationNode, channelIndex);
   ```
3. Message receiving via events:
   ```typescript
   device.events.onMessagePacket.subscribe((packet) => {
     // Update UI with new message
   });
   ```
4. Message notifications and sound (optional)

**Deliverables:**
- Full messaging functionality (super easy with official library!)
- Send/receive text messages
- Real-time updates

#### Phase 5: Enhanced Features (Week 3-4)
**Goal:** More views and features

Tasks:
1. Implement "Map" view:
   - ASCII/text-based map showing node positions
   - Use characters or blocks to represent nodes
   - Show relative positions if GPS available
   - Alternative: Simple list with coordinates
2. Implement "Config" view:
   - Display device configuration
   - Show channel settings
   - Read-only for now (write in Phase 6)
3. Add connection management:
   - Connection dialog at startup
   - Recent connections list
   - Reconnection handling
4. Improve UI:
   - Color coding (online/offline nodes)
   - Better formatting
   - Status indicators

**Deliverables:**
- Map view
- Config view
- Connection management

#### Phase 6: Advanced Features (Week 4+)
**Goal:** Polish and advanced functionality

Tasks:
1. Configuration editing:
   - Modify device config
   - Change channel settings
   - User profile editing
2. Telemetry display:
   - Battery levels
   - Signal strength graphs
   - Environmental sensors
3. Filtering and search:
   - Filter nodes by criteria
   - Search messages
   - Custom views
4. Export functionality:
   - Export messages to file
   - Export node database
5. Error handling and recovery:
   - Connection timeouts
   - Retry logic
   - User feedback

**Deliverables:**
- Configuration editing
- Telemetry visualization
- Polish and stability

---

## Key Implementation Details

### HTTP Polling Strategy

The `@meshtastic/transport-http` library handles polling automatically! You just need to:

```typescript
import { MeshDevice } from "@meshtastic/core";
import { TransportHTTP } from "@meshtastic/transport-http";

// Create transport and device
const transport = await TransportHTTP.create("10.10.0.57");
const device = new MeshDevice(transport);

// Subscribe to events - polling happens automatically!
device.events.onMessagePacket.subscribe((packet) => {
  console.log("New message:", packet);
});

device.events.onNodeInfoPacket.subscribe((nodeInfo) => {
  console.log("Node update:", nodeInfo);
});
```

**That's it!** The library handles all the complexity of polling `/api/v1/fromradio`.

### Protobuf Integration

**No setup needed!** Just import types:

```typescript
import { Protobuf } from "@meshtastic/protobufs";

// All protobuf types are available
const nodeInfo: Protobuf.Mesh.NodeInfo = { /* ... */ };
const meshPacket: Protobuf.Mesh.MeshPacket = { /* ... */ };
const toRadio: Protobuf.Mesh.ToRadio = { /* ... */ };
```

The official library handles all serialization/deserialization automatically.

### Message Handling

Use the event system provided by `@meshtastic/core`:

```typescript
import { MeshDevice } from "@meshtastic/core";

const device = new MeshDevice(transport);

// Subscribe to specific event types
device.events.onNodeInfoPacket.subscribe((nodeInfo) => {
  appState.updateNode(nodeInfo);
});

device.events.onUserPacket.subscribe((user) => {
  appState.updateUser(user);
});

device.events.onMessagePacket.subscribe((message) => {
  appState.addMessage(message);
  ui.updateMessageView();
});

device.events.onPositionPacket.subscribe((position) => {
  appState.updatePosition(position);
  ui.updateMapView();
});

// Connection events
device.events.onDeviceStatus.subscribe((status) => {
  ui.updateConnectionStatus(status);
});
```

**Event types are fully typed** thanks to TypeScript!

### TUI Event Loop with Blessed

Simple event-driven architecture:

```typescript
import blessed from 'blessed';
import { MeshDevice } from "@meshtastic/core";
import { TransportHTTP } from "@meshtastic/transport-http";

async function main() {
  // Initialize screen
  const screen = blessed.screen({ smartCSR: true });

  // Connect to device
  const transport = await TransportHTTP.create("10.10.0.57");
  const device = new MeshDevice(transport);

  // Create UI components
  const nodesBox = blessed.listtable({ /* ... */ });
  const messagesBox = blessed.log({ /* ... */ });

  // Subscribe to device events → update UI
  device.events.onNodeInfoPacket.subscribe((nodeInfo) => {
    updateNodesTable(nodesBox, nodeInfo);
    screen.render();
  });

  device.events.onMessagePacket.subscribe((message) => {
    messagesBox.log(formatMessage(message));
    screen.render();
  });

  // Keyboard handling
  screen.key(['q', 'C-c'], () => {
    device.disconnect();
    process.exit(0);
  });

  screen.key(['tab'], () => {
    switchTab();
  });

  // Initial render
  screen.render();
}

main().catch(console.error);
```

**Much simpler than managing async tasks manually!**

---

## Minimal Viable Product (MVP)

**Goal:** Working TUI in 1 week (or less!)

Focus on:
1. **HTTP connection** using `@meshtastic/transport-http` (Day 1-2)
2. **Node list view** with Blessed (Day 3-4)
3. **Message view** with send/receive (Day 5-7)

This provides core functionality: **connect → see nodes → chat**

**Estimated development time:** 7 days vs. 4-6 weeks for Rust implementation!

---

## Testing Strategy

1. **Unit tests** for protobuf parsing and state management
2. **Integration tests** with mock HTTP server
3. **Manual testing** with real Meshtastic device
4. **Consider** using the official web client as reference for expected behavior

---

## Documentation Needs

1. Setup instructions (Rust, dependencies)
2. Configuration file format (store device URLs, preferences)
3. Keyboard shortcuts reference
4. Architecture overview for contributors
5. Protocol notes and gotchas

---

## Alternative Approaches

### Option 1: TypeScript + Ink (React-based)

If you prefer React patterns over traditional widgets:

```typescript
import React, { useState, useEffect } from 'react';
import { render, Box, Text } from 'ink';
import { MeshDevice } from "@meshtastic/core";
import { TransportHTTP } from "@meshtastic/transport-http";

function App() {
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    const transport = await TransportHTTP.create("10.10.0.57");
    const device = new MeshDevice(transport);

    device.events.onNodeInfoPacket.subscribe((node) => {
      setNodes(prev => [...prev, node]);
    });
  }, []);

  return (
    <Box flexDirection="column">
      <Text>Nodes: {nodes.length}</Text>
      {nodes.map(node => <Text key={node.num}>{node.user?.longName}</Text>)}
    </Box>
  );
}

render(<App />);
```

**Benefits:**
- React component model (if you know React)
- State management with hooks
- Still uses official Meshtastic libraries

**Drawbacks:**
- Less feature-rich than Blessed for complex layouts
- Fewer widgets available

### Option 2: Python + Textual

If you prefer Python:

```python
from textual.app import App
from textual.widgets import Header, Footer, ListView
# Note: Would need to implement HTTP transport or use Python meshtastic library

class MeshtasticTUI(App):
    # ... implementation
```

**Benefits:**
- Textual is excellent (modern, async, CSS-like styling)
- Python is easy to prototype with

**Drawbacks:**
- No official Meshtastic HTTP transport library for Python
- Would need to implement protocol yourself
- Python meshtastic library is CLI-focused, not library-focused

### Option 3: Rust + Ratatui

For maximum performance:

**Benefits:**
- Beautiful TUI with Ratatui
- Fast and efficient
- Type-safe

**Drawbacks:**
- Must reimplement entire protocol
- Must handle protobuf compilation
- Weeks more development time
- Harder to maintain (keep up with protocol changes)

---

## Recommended Choice: TypeScript + Blessed

**Why this is the best option:**

✅ **Official libraries** - No protocol reimplementation
✅ **Fast development** - 1 week vs. 4-6 weeks
✅ **Type safety** - TypeScript catches errors
✅ **Maintainable** - Library updates = automatic protocol updates
✅ **Feature-rich UI** - Blessed has all widgets needed
✅ **Cross-platform** - Works on Linux, macOS, Windows

---

## Next Steps

1. ✅ **Analyze web client** - DONE
2. ✅ **Create implementation plan** - DONE
3. **Initialize TypeScript project**
4. **Install Meshtastic libraries**
5. **Test connection with device** (Phase 1)
6. **Build basic TUI** (Phase 2-3)
7. **Add messaging** (Phase 4)

---

## Ready to Build?

Would you like me to start implementing? I can:

1. **Initialize the project** - Set up package.json, tsconfig.json, etc.
2. **Create Phase 1** - Basic HTTP connection and console output
3. **Build Phase 2-3** - Working TUI with nodes list
4. **Implement Phase 4** - Full messaging functionality

We can have a working MVP in about a week of development!
