# Fast Agent Server

A WebSocket-based AI agent server that provides a communication bridge between the Nexus application and AI capabilities.

## Overview

Fast Agent is a Python-based WebSocket server designed to simulate an AI agent with tool-use capabilities. It provides:

- Real-time bidirectional communication via WebSockets
- Tool execution for capabilities like weather forecasts and calculations
- Message history tracking and retrieval
- Flexible configuration and error handling

This server is part of the Nexus project's architecture, enabling the front-end application to connect to AI services through a standardized protocol.

## Installation

Fast Agent supports both Unix-based systems (macOS, Linux) and Windows with modern package management through [uv](https://github.com/astral-sh/uv).

### Prerequisites

- Python 3.8 or higher
- Git (to clone the repository)

### Installation on Unix-based Systems (macOS, Linux)

1. Navigate to the fast_agent directory:
   ```bash
   cd /path/to/nexus/fast_agent
   ```

2. Make the installation script executable:
   ```bash
   chmod +x install.sh
   ```

3. Run the installation script:
   ```bash
   ./install.sh
   ```

The script will:
- Install uv if not already present
- Create a virtual environment
- Install all dependencies

### Installation on Windows

1. Navigate to the fast_agent directory in PowerShell:
   ```powershell
   cd \path\to\nexus\fast_agent
   ```

2. Run the installation script:
   ```powershell
   .\install.ps1
   ```

The script will:
- Install uv if not already present
- Create a virtual environment
- Install all dependencies

## Running the Server

After installation, you can start the server with:

```bash
python server.py
```

The server will run at http://localhost:8000 with the WebSocket endpoint available at ws://localhost:8000/ws/{client_id}

## Configuration

The server can be configured by modifying the following parameters in the `server.py` file:

- Host: Change the `host` parameter in the `uvicorn.run()` call (default: "0.0.0.0")
- Port: Change the `port` parameter in the `uvicorn.run()` call (default: 8000)
- CORS settings: Modify the CORS middleware configuration for production environments

For production deployments, consider:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-production-domain.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

## API and Endpoints

### WebSocket Endpoint

The main WebSocket endpoint is available at:

```
ws://localhost:8000/ws/{client_id}
```

Where `{client_id}` is a unique identifier for the client. If not provided, the server will generate a UUID.

### Message Types

Fast Agent uses a simple message protocol with JSON payloads:

#### Client to Server

| Type | Description | Example Payload |
|------|-------------|-----------------|
| `ping` | Check server connectivity | `{"type": "ping", "data": {"timestamp": 1629000000000}}` |
| `initialize` | Initialize the agent | `{"type": "initialize", "data": {"client_info": {"name": "example-client"}}}` |
| `user_message` | Send a user message | `{"type": "user_message", "data": {"content": "What's the weather in New York?"}}` |
| `tool_response` | Respond to a tool request | `{"type": "tool_response", "data": {"tool": {"id": "weather_tool", "name": "GetWeather", "result": {"temperature": 72, "condition": "sunny"}}}}` |
| `request_history` | Request message history | `{"type": "request_history"}` |

#### Server to Client

| Type | Description | Example Payload |
|------|-------------|-----------------|
| `connection_established` | Confirms connection | `{"type": "connection_established", "data": {"client_id": "123", "server_info": {"name": "Fast-Agent Test Server", "version": "0.1.0"}}}` |
| `pong` | Response to ping | `{"type": "pong", "data": {"timestamp": 1629000000000}}` |
| `initialized` | Response to initialization | `{"type": "initialized", "data": {"capabilities": ["text_generation", "image_analysis", "code_completion"]}}` |
| `thinking_started` | Agent started processing | `{"type": "thinking_started", "data": {"message_id": "abc123"}}` |
| `thinking_complete` | Agent finished processing | `{"type": "thinking_complete", "data": {"message_id": "abc123"}}` |
| `tool_request` | Request to use a tool | `{"type": "tool_request", "data": {"tool": {"id": "weather_tool", "name": "GetWeather", "arguments": {"location": "New York"}, "message_id": "abc123"}}}` |
| `assistant_message` | Response from the agent | `{"type": "assistant_message", "data": {"content": "Hello! How can I help you today?", "message_id": "def456", "in_response_to": "abc123"}}` |
| `history_response` | Message history | `{"type": "history_response", "data": {"history": [...]}}` |
| `error` | Error message | `{"type": "error", "data": {"error": "Unknown message type", "code": "UNKNOWN_MESSAGE_TYPE"}}` |

## Integration with Nexus

Fast Agent integrates with the Nexus application through:

1. **Bridge**: `/src/lib/fast-agent/bridge.ts` - Handles WebSocket communication
2. **Hooks**: 
   - `/src/lib/fast-agent/hooks/use-fast-agent.ts` - React hook for agent interactions
   - `/src/lib/fast-agent/hooks/use-fast-agent-tools.ts` - React hook for tool management

3. **Components**:
   - `/src/components/chat/fast-agent-chat.tsx` - Chat interface
   - `/src/components/chat/fast-agent-tools-demo.tsx` - Tool demonstration

## Testing

You can test the server using the included test client:

```bash
python test_client.py
```

The test client will:
1. Connect to the server
2. Send a ping message
3. Initialize the agent
4. Send a test user message
5. Request message history

## Example Code

### Connecting to Fast Agent from React

```tsx
import { useEffect, useState } from 'react';
import { useFastAgent } from '@/lib/fast-agent/hooks';

export default function ChatComponent() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  
  const { 
    connect, 
    sendMessage, 
    disconnect, 
    isConnected, 
    status 
  } = useFastAgent({
    url: 'ws://localhost:8000/ws'
  });
  
  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);
  
  const handleSend = () => {
    if (input.trim() && isConnected) {
      sendMessage('user_message', { content: input });
      setInput('');
    }
  };
  
  return (
    <div>
      <div>Connection status: {status}</div>
      <div>
        {messages.map((msg, i) => (
          <div key={i}>{msg.content}</div>
        ))}
      </div>
      <input 
        value={input} 
        onChange={(e) => setInput(e.target.value)} 
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

## Contributing

To contribute to Fast Agent:

1. Follow the Nexus project's code style guidelines
2. Ensure all tests pass before submitting code
3. For major changes, open an issue first to discuss proposed changes

## License

Part of the Nexus project