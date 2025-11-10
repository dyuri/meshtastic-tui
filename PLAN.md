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

**Language: Rust** (or Python as alternative)

**Reasons for Rust:**
- Excellent TUI libraries (ratatui, tui-rs)
- Strong protobuf support (prost)
- Type safety and performance
- Cross-platform support
- Good HTTP client libraries (reqwest)

**Core Dependencies:**
- `ratatui` - Modern TUI framework (successor to tui-rs)
- `crossterm` - Terminal manipulation
- `prost` - Protobuf implementation
- `reqwest` - HTTP client
- `tokio` - Async runtime
- `serde` - Serialization framework

**Alternative: Python**
- `textual` or `urwid` - TUI frameworks
- `protobuf` - Google's protobuf library
- `requests` or `httpx` - HTTP clients
- Good for rapid development

### Architecture

```
meshtastic-tui/
├── src/
│   ├── main.rs
│   ├── app.rs              # Main application state
│   ├── ui/                 # UI components
│   │   ├── mod.rs
│   │   ├── layout.rs       # Layout management
│   │   ├── nodes.rs        # Nodes list view
│   │   ├── messages.rs     # Messages view
│   │   ├── map.rs          # ASCII/text map view
│   │   ├── config.rs       # Configuration view
│   │   └── input.rs        # Input handling
│   ├── client/             # HTTP client & protocol
│   │   ├── mod.rs
│   │   ├── transport.rs    # HTTP transport layer
│   │   ├── device.rs       # Device abstraction
│   │   └── proto.rs        # Protobuf helpers
│   ├── models/             # Data models
│   │   ├── mod.rs
│   │   ├── node.rs         # Node information
│   │   ├── message.rs      # Message types
│   │   └── config.rs       # Configuration
│   └── utils/              # Utilities
│       ├── mod.rs
│       └── time.rs         # Time formatting
├── proto/                  # Protobuf definitions
│   └── meshtastic/
├── Cargo.toml
└── README.md
```

### Implementation Phases

#### Phase 1: Foundation (Week 1)
**Goal:** Basic HTTP connection and protobuf handling

Tasks:
1. Set up Rust project with dependencies
2. Import Meshtastic protobuf definitions
3. Implement HTTP transport layer:
   - `connect(url)` - Connect to device
   - `send_to_radio(msg)` - Send ToRadio message
   - `read_from_radio()` - Read FromRadio message
   - `poll_updates()` - Poll for new messages
4. Test connection with real device
5. Print received messages to console

**Deliverables:**
- Working HTTP client that can connect and exchange protobufs
- Console output showing node info and messages

#### Phase 2: Data Models & State Management (Week 1-2)
**Goal:** Maintain synchronized state with device

Tasks:
1. Create data models for:
   - `Node` - Node information with user, position, metrics
   - `Message` - Chat messages
   - `Channel` - Channel configuration
   - `AppState` - Overall application state
2. Implement state management:
   - Initial sync handler (process config_complete_id)
   - Node database updates
   - Message history
   - Connection state
3. Message queue for outgoing messages

**Deliverables:**
- In-memory database of nodes
- Message history
- State synchronization with device

#### Phase 3: Basic TUI (Week 2)
**Goal:** Simple working interface

Tasks:
1. Set up ratatui with crossterm backend
2. Create basic layout:
   - Header with connection status
   - Main content area (tabbed)
   - Status/notification bar
   - Input line at bottom
3. Implement "Nodes" tab:
   - List of nodes with columns: Name, ID, SNR, Last Heard, Hops
   - Scrollable list
   - Node details panel (when selected)
4. Basic keyboard navigation (arrow keys, tab, q to quit)

**Deliverables:**
- Working TUI with nodes list
- Keyboard navigation

#### Phase 4: Messages View (Week 2-3)
**Goal:** Send and receive messages

Tasks:
1. Implement "Messages" tab:
   - Message list showing sender, timestamp, content
   - Message input at bottom
   - Channel indicator
2. Message sending:
   - Text input field
   - Send on Enter
   - Destination selection (broadcast, direct, channel)
3. Message receiving:
   - Parse incoming MeshPackets
   - Filter by port number (TEXT_MESSAGE_APP = port 1)
   - Update UI in real-time
4. Message notifications

**Deliverables:**
- Full messaging functionality
- Send/receive text messages

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

Since HTTP doesn't have native push notifications, implement polling:

```rust
async fn poll_updates(transport: &HttpTransport) {
    loop {
        match transport.read_from_radio().await {
            Ok(messages) if !messages.is_empty() => {
                for msg in messages {
                    handle_from_radio(msg).await;
                }
            }
            Ok(_) => {} // No new messages
            Err(e) => log_error(e),
        }
        tokio::time::sleep(Duration::from_millis(500)).await;
    }
}
```

### Protobuf Integration

Use `prost-build` to generate Rust code from `.proto` files:

```rust
// build.rs
fn main() {
    prost_build::compile_protos(
        &["proto/meshtastic/mesh.proto", /* ... */],
        &["proto/"]
    ).unwrap();
}
```

### Message Handling

Parse FromRadio variants:

```rust
match from_radio.payload_variant {
    Some(PayloadVariant::Packet(mesh_packet)) => {
        // Handle incoming message
    }
    Some(PayloadVariant::NodeInfo(node_info)) => {
        // Update node database
    }
    Some(PayloadVariant::MyInfo(my_info)) => {
        // Store our node info
    }
    Some(PayloadVariant::ConfigCompleteId(_)) => {
        // Initial sync complete
    }
    // ... other variants
}
```

### TUI Event Loop

Use async task for UI and network:

```rust
#[tokio::main]
async fn main() {
    let (tx, rx) = mpsc::channel();

    // Spawn network task
    tokio::spawn(async move {
        poll_updates(&transport, tx).await;
    });

    // Run UI loop
    loop {
        terminal.draw(|f| ui::draw(f, &app_state))?;

        if event::poll(Duration::from_millis(100))? {
            if let Event::Key(key) = event::read()? {
                handle_key(key, &mut app_state)?;
            }
        }

        // Process network messages
        while let Ok(msg) = rx.try_recv() {
            app_state.update(msg);
        }
    }
}
```

---

## Minimal Viable Product (MVP)

For quickest results, focus on:

1. **HTTP connection** to device (Phase 1)
2. **Node list view** (Phase 3)
3. **Message view** with send/receive (Phase 4)

This provides core functionality: connect, see nodes, chat.

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

### Simpler Start: Python + Textual

For faster prototyping:
```python
from textual.app import App
from textual.widgets import Header, Footer, ListView
import requests
from meshtastic import mesh_pb2

class MeshtasticTUI(App):
    # ... implementation
```

Benefits:
- Faster development
- Easier protobuf integration (Google's official library)
- Good TUI framework (Textual is modern and feature-rich)

Drawbacks:
- Slower performance
- Larger runtime dependencies

### Re-use JavaScript Libraries

Could use Node.js with blessed/ink and official `@meshtastic` packages:
- Fastest to market (libraries already exist)
- Direct compatibility with web client
- But: JavaScript in terminal is less common

---

## Next Steps

1. **Choose language** (Rust recommended, Python for speed)
2. **Set up project** structure
3. **Clone protobufs** from Meshtastic repository
4. **Start Phase 1** - Basic HTTP connection
5. **Test with device** to validate approach

Would you like me to start implementing the TUI client? I can begin with Phase 1 in Rust or Python based on your preference.
