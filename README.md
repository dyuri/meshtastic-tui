# Meshtastic TUI

A Terminal User Interface (TUI) client for Meshtastic mesh networking devices.

## Features

- 🌐 HTTP-only connection (no Bluetooth or Serial required)
- 📡 Real-time node discovery and monitoring
- 💬 Send and receive text messages
- 🗺️ View node positions and mesh topology
- ⚙️ View device configuration
- 🎨 Clean terminal interface with keyboard navigation

## Prerequisites

- Node.js 18+ and npm
- A Meshtastic device with HTTP server enabled and accessible on your network

## Installation

```bash
# Install dependencies
npm install
```

## Usage

### Testing Connection

Before running the full TUI, you can test your connection:

```bash
# Test with default IP (10.10.0.57)
npm run test:connection

# Test with custom IP
MESHTASTIC_HOST=192.168.1.100 npm run test:connection
```

### Running the TUI

```bash
# Run the TUI interface (recommended)
npm run tui

# Or with custom IP
MESHTASTIC_HOST=192.168.1.100 npm run tui

# Run console version (simple text output)
npm run dev

# Or build and run compiled version
npm run build
npm start
```

### Using the TUI

Once running, you'll see the interactive terminal interface:

**Keyboard Shortcuts:**
- `Tab` - Switch between views (Nodes / Messages)
- `1` / `2` - Jump to specific view
- `↑` / `↓` - Navigate lists
- `C` - Compose message (in Messages view)
- `Enter` - Send message / Select item
- `R` - Refresh display
- `?` / `H` - Show help
- `Q` / `Ctrl+C` - Quit

**Views:**
- **Nodes View** - See all mesh nodes with status, SNR, last heard time, GPS position, battery level, and more
- **Messages View** - Send and receive text messages (broadcast or direct)

## Configuration

Set the device IP address via environment variable:

```bash
export MESHTASTIC_HOST=192.168.1.100
npm run dev
```

## Project Structure

```
meshtastic-tui/
├── src/
│   ├── index.ts           # Main entry point
│   ├── app.ts             # Application class
│   ├── test-connection.ts # Connection test script
│   ├── ui/                # UI components
│   ├── client/            # Device client wrapper
│   ├── models/            # Data models
│   └── utils/             # Utilities
├── dist/                  # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## Tech Stack

- **TypeScript** - Type-safe JavaScript
- **@meshtastic/core** - Official Meshtastic device library
- **@meshtastic/transport-http** - HTTP transport for Meshtastic
- **@meshtastic/protobufs** - Protocol Buffer definitions
- **blessed** - Terminal UI framework

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build TypeScript
npm run build

# Test connection
npm run test:connection
```

## Architecture

The application uses the official Meshtastic JavaScript libraries:

- `@meshtastic/core` provides the `MeshDevice` class for device interaction
- `@meshtastic/transport-http` handles HTTP communication
- `@meshtastic/protobufs` contains all Protocol Buffer definitions

This means we don't need to reimplement the protocol - we get all the benefits of the official implementation!

## Roadmap

- [x] Phase 1: Basic HTTP connection and state management
- [x] Phase 2: Data models and event system
- [x] Phase 3: Nodes view with Blessed TUI
- [x] Phase 4: Messages view (send/receive)
- [ ] Phase 5: Enhanced features (map view, telemetry graphs)
- [ ] Phase 6: Configuration editing and advanced features

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

## Resources

- [Meshtastic Documentation](https://meshtastic.org/docs)
- [Meshtastic Web Client](https://github.com/meshtastic/web)
- [Meshtastic HTTP API](https://meshtastic.org/docs/development/device/http-api/)
