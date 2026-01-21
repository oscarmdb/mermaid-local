# Mermaid Editor 🎨

A beautiful, **100% offline** and **secure** Mermaid diagram editor. Create, preview, and export diagrams without any data ever leaving your machine.

![Security Badge](https://img.shields.io/badge/Security-Offline%20Mode-green)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

## ✨ Features

- **🔒 Completely Offline** - No internet connection required. All processing happens locally.
- **🛡️ Secure by Design** - Strict Content Security Policy, no external requests, sandboxed execution.
- **🎨 Beautiful UI** - Modern, responsive interface with dark/light theme support.
- **📝 Live Preview** - See your diagrams update in real-time as you type.
- **📤 Multiple Export Formats** - Export to SVG, PNG (1x and 2x), or Mermaid source.
- **📚 Built-in Templates** - Start quickly with templates for all diagram types.
- **⌨️ Keyboard Shortcuts** - Work efficiently with `Ctrl+E` to export, `Ctrl+B` for templates.

## 🔐 Security Features

This application is designed with security as a top priority:

| Feature | Description |
|---------|-------------|
| **Offline Operation** | No network requests during usage |
| **Strict CSP** | `default-src 'self'` blocks all external resources |
| **Docker Network Isolation** | Container runs with `internal: true` network |
| **Read-only Filesystem** | Container filesystem is immutable |
| **No Privileges** | Runs with `no-new-privileges` and dropped capabilities |
| **Local Storage Only** | Your diagrams never leave your browser |

## 🚀 Quick Start

### Using Docker Compose (Recommended)

```bash
# Clone or download this repository
cd mermaid-host

# Build and run with Docker Compose
docker-compose -f docker/docker-compose.yml up -d

# Open in browser
open http://localhost:3000
```

### Using Docker directly

```bash
# Build the image
docker build -f docker/Dockerfile -t mermaid-editor .

# Run with network isolation
docker run -d \
  --name mermaid-editor \
  --network none \
  --read-only \
  --tmpfs /var/cache/nginx:mode=1777,size=10m \
  --tmpfs /var/run:mode=1777,size=1m \
  --cap-drop ALL \
  --cap-add NET_BIND_SERVICE \
  --security-opt no-new-privileges:true \
  -p 3000:80 \
  mermaid-editor
```

### Development Mode

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

## 📊 Supported Diagram Types

- **Flowcharts** - Process flows and decision trees
- **Sequence Diagrams** - Interaction between components
- **Class Diagrams** - OOP class structures
- **State Diagrams** - State machines and transitions
- **Entity Relationship** - Database schemas
- **Gantt Charts** - Project timelines
- **Pie Charts** - Data distribution
- **Git Graphs** - Branch visualization
- **Mind Maps** - Hierarchical concepts
- **Timeline** - Historical events
- **User Journeys** - Experience mapping
- **Quadrant Charts** - Priority matrices

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+E` / `Cmd+E` | Open export dialog |
| `Ctrl+B` / `Cmd+B` | Toggle templates sidebar |
| `Ctrl+S` / `Cmd+S` | Save (auto-saved to localStorage) |

## 🏗️ Architecture

```
mermaid-host/
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Core libraries (Mermaid, Monaco setup)
│   └── styles/         # CSS and Tailwind styles
├── docker/
│   ├── Dockerfile      # Multi-stage build
│   ├── docker-compose.yml  # Orchestration with security
│   └── nginx.conf      # Web server with CSP headers
└── public/             # Static assets
```

## 🔧 Configuration

### Environment Variables

No environment variables required - the app is fully self-contained.

### Mermaid Configuration

Edit `src/lib/mermaid-config.ts` to customize:
- Diagram themes and colors
- Font families (system fonts only)
- Default diagram settings

### Security Configuration

Edit `docker/nginx.conf` to adjust:
- Content Security Policy headers
- Caching behavior
- Additional security headers

## 📝 License

MIT License - Feel free to use, modify, and distribute.

## 🙏 Acknowledgments

- [Mermaid.js](https://mermaid.js.org/) - The amazing diagramming library
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - VS Code's editor
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Vite](https://vitejs.dev/) - Lightning fast build tool
