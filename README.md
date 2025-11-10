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
# Development mode (with hot reload)
npm run dev

# Or build and run
npm run build
npm start
```

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
- **blessed** (Coming soon) - Terminal UI framework

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

- [x] Phase 1: Basic HTTP connection
- [ ] Phase 2: State management
- [ ] Phase 3: Nodes view with Blessed
- [ ] Phase 4: Messages view
- [ ] Phase 5: Map and config views
- [ ] Phase 6: Advanced features

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

## Resources

- [Meshtastic Documentation](https://meshtastic.org/docs)
- [Meshtastic Web Client](https://github.com/meshtastic/web)
- [Meshtastic HTTP API](https://meshtastic.org/docs/development/device/http-api/)
