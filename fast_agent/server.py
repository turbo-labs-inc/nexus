#!/usr/bin/env python3
"""
Test Fast-Agent Server

A simple FastAPI WebSocket server that can be used to test the Fast-Agent Bridge.
"""

import asyncio
import json
import logging
import uuid
from typing import Dict, List, Optional, Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fast-agent-server")

# Initialize FastAPI app
app = FastAPI(title="Fast-Agent Test Server")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active connections
active_connections: Dict[str, WebSocket] = {}

# Message history for each connection
message_history: Dict[str, List[Dict[str, Any]]] = {}


class ConnectionManager:
    """Manages WebSocket connections"""
    
    @staticmethod
    async def connect(websocket: WebSocket, client_id: str) -> None:
        """Accept connection and store it"""
        await websocket.accept()
        active_connections[client_id] = websocket
        message_history[client_id] = []
        logger.info(f"Client connected: {client_id}")
    
    @staticmethod
    async def disconnect(client_id: str) -> None:
        """Remove connection"""
        if client_id in active_connections:
            del active_connections[client_id]
        if client_id in message_history:
            del message_history[client_id]
        logger.info(f"Client disconnected: {client_id}")
    
    @staticmethod
    async def send_message(client_id: str, message: Dict[str, Any]) -> None:
        """Send message to specific client"""
        if client_id in active_connections:
            websocket = active_connections[client_id]
            message_history[client_id].append(message)
            await websocket.send_json(message)
            logger.info(f"Message sent to {client_id}: {message['type']}")


@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for Fast-Agent communication"""
    if not client_id:
        client_id = str(uuid.uuid4())
    
    connection_manager = ConnectionManager()
    await connection_manager.connect(websocket, client_id)
    
    try:
        # Send initialization confirmation
        await connection_manager.send_message(
            client_id,
            {
                "type": "connection_established",
                "data": {
                    "client_id": client_id,
                    "server_info": {
                        "name": "Fast-Agent Test Server",
                        "version": "0.1.0"
                    }
                }
            }
        )
        
        # Main message processing loop
        while True:
            # Receive message from client
            message = await websocket.receive_json()
            logger.info(f"Received message from {client_id}: {message.get('type', 'unknown')}")
            
            # Store message in history
            if client_id in message_history:
                message_history[client_id].append(message)
            
            # Process message based on type
            message_type = message.get("type")
            
            if message_type == "ping":
                # Respond to ping
                await connection_manager.send_message(
                    client_id, 
                    {"type": "pong", "data": {"timestamp": message.get("data", {}).get("timestamp")}}
                )
            
            elif message_type == "initialize":
                # Respond to initialization
                await connection_manager.send_message(
                    client_id,
                    {
                        "type": "initialized",
                        "data": {
                            "capabilities": [
                                "text_generation",
                                "image_analysis",
                                "code_completion"
                            ]
                        }
                    }
                )
            
            elif message_type == "user_message":
                # Process user message and potentially use tools
                user_content = message.get("data", {}).get("content", "")
                message_id = message.get("message_id")
                
                # Simulate thinking delay
                await asyncio.sleep(1)
                
                # Send thinking started
                await connection_manager.send_message(
                    client_id,
                    {"type": "thinking_started", "data": {"message_id": message_id}}
                )
                
                # Simulate processing delay
                await asyncio.sleep(2)
                
                # Check for tool-related keywords
                content_lower = user_content.lower()
                
                if "weather" in content_lower and ("city" in content_lower or "in" in content_lower):
                    # Request weather tool
                    location = None
                    
                    # Very basic extraction - in production this would be more sophisticated
                    if "in" in content_lower:
                        location_part = content_lower.split("in", 1)[1].strip()
                        location = location_part.split()[0]
                    
                    await connection_manager.send_message(
                        client_id,
                        {
                            "type": "tool_request",
                            "messageId": str(uuid.uuid4()),
                            "data": {
                                "tool": {
                                    "id": "weather_tool",
                                    "name": "GetWeather",
                                    "arguments": {
                                        "location": location or "New York"
                                    },
                                    "message_id": message_id
                                }
                            }
                        }
                    )
                    
                elif "calculate" in content_lower or "calculator" in content_lower or any(op in content_lower for op in ["+", "-", "*", "/", "="]):
                    # Request calculator tool
                    expression = None
                    
                    # Very basic extraction
                    for char in ["+", "-", "*", "/"]:
                        if char in content_lower:
                            parts = content_lower.replace("=", "").replace("calculate", "").replace("calculator", "").strip()
                            expression = parts
                            break
                    
                    await connection_manager.send_message(
                        client_id,
                        {
                            "type": "tool_request",
                            "messageId": str(uuid.uuid4()),
                            "data": {
                                "tool": {
                                    "id": "calculator_tool",
                                    "name": "Calculate",
                                    "arguments": {
                                        "expression": expression or "2+2"
                                    },
                                    "message_id": message_id
                                }
                            }
                        }
                    )
                    
                else:
                    # Normal response without tools
                    await connection_manager.send_message(
                        client_id,
                        {
                            "type": "assistant_message",
                            "data": {
                                "content": f"You said: {user_content}\n\nTip: Try asking about weather in a city or to calculate something!",
                                "message_id": str(uuid.uuid4()),
                                "in_response_to": message_id
                            }
                        }
                    )
                
                # Send thinking complete
                await connection_manager.send_message(
                    client_id,
                    {"type": "thinking_complete", "data": {"message_id": message_id}}
                )
            
            elif message_type == "tool_response":
                # Process tool response
                tool_data = message.get("data", {}).get("tool", {})
                
                if tool_data:
                    tool_name = tool_data.get("name", "Tool")
                    tool_result = tool_data.get("result", "No result")
                    
                    # Send assistant message with tool results
                    await connection_manager.send_message(
                        client_id,
                        {
                            "type": "assistant_message",
                            "data": {
                                "content": f"I used the {tool_name} tool and got: {tool_result}",
                                "message_id": str(uuid.uuid4())
                            }
                        }
                    )
            
            elif message_type == "request_history":
                # Send message history
                if client_id in message_history:
                    await connection_manager.send_message(
                        client_id,
                        {
                            "type": "history_response",
                            "data": {"history": message_history[client_id]}
                        }
                    )
            
            else:
                # Unknown message type
                await connection_manager.send_message(
                    client_id,
                    {
                        "type": "error",
                        "data": {
                            "error": f"Unknown message type: {message_type}",
                            "code": "UNKNOWN_MESSAGE_TYPE"
                        }
                    }
                )
    
    except WebSocketDisconnect:
        await connection_manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"Error in WebSocket connection: {str(e)}")
        await connection_manager.disconnect(client_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)