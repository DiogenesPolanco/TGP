#!/usr/bin/env bash
# Start Penpot MCP server + Plugin server
# Run this BEFORE opening OpenCode

set -e

# Auto-detect path: works on Linux and macOS
if [ -d "$HOME/.npm-global/lib/node_modules/@penpot/mcp" ]; then
  PENPOT_DIR="$HOME/.npm-global/lib/node_modules/@penpot/mcp"
elif [ -d "$HOME/node_modules/@penpot/mcp" ]; then
  PENPOT_DIR="$HOME/node_modules/@penpot/mcp"
elif [ -d "/usr/local/lib/node_modules/@penpot/mcp" ]; then
  PENPOT_DIR="/usr/local/lib/node_modules/@penpot/mcp"
else
  echo "❌ @penpot/mcp not found. Install: npm install -g @penpot/mcp"
  exit 1
fi

# Use platform temp dir (macOS: $TMPDIR, Linux: /tmp)
LOG_DIR="${TMPDIR:-/tmp}"

echo "Starting Penpot MCP Server..."
cd "$PENPOT_DIR/packages/server" || exit 1
nohup node dist/index.js > "$LOG_DIR/penpot-mcp-server.log" 2>&1 &
MCP_PID=$!
echo "  MCP Server PID: $MCP_PID (port 4401)"

echo "Starting Penpot Plugin Server..."
cd "$PENPOT_DIR/packages/plugin" || exit 1
nohup npx vite preview --port 4400 --host 0.0.0.0 > "$LOG_DIR/penpot-plugin-server.log" 2>&1 &
PLUGIN_PID=$!
echo "  Plugin Server PID: $PLUGIN_PID (port 4400)"

sleep 2

if kill -0 $MCP_PID 2>/dev/null; then
  echo "✅ MCP Server running on http://localhost:4401/mcp"
else
  echo "❌ MCP Server failed to start!"
  tail -5 "$LOG_DIR/penpot-mcp-server.log"
  exit 1
fi

if kill -0 $PLUGIN_PID 2>/dev/null; then
  echo "✅ Plugin Server running on http://localhost:4400"
else
  echo "❌ Plugin Server failed to start!"
  tail -5 "$LOG_DIR/penpot-plugin-server.log"
  exit 1
fi

echo ""
echo "Done. Now:"
echo "  1. Open design.penpot.app → tu archivo de diseño"
echo "  2. Ctrl+Alt+P → Plugin Manager"
echo "  3. Pega: http://localhost:4400/manifest.json"
echo "  4. Ejecuta el plugin → Connect to MCP server"
echo "  5. Abre OpenCode"
