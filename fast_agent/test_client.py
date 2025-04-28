#!/usr/bin/env python3
import asyncio
import json
import websockets
import uuid
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("FastAgentClient")

class FastAgentClient:
    def __init__(self, host="localhost", port=8000):
        """Initialize the Fast-Agent test client with server details."""
        self.client_id = str(uuid.uuid4())
        self.uri = f"ws://{host}:{port}/ws/{self.client_id}"
        self.websocket = None
        logger.info(f"Initialized client with ID: {self.client_id}")

    async def connect(self):
        """Establish connection to the Fast-Agent WebSocket server."""
        try:
            self.websocket = await websockets.connect(self.uri)
            logger.info(f"Connected to {self.uri}")
            return True
        except Exception as e:
            logger.error(f"Connection failed: {e}")
            return False

    async def send_message(self, message_type, data=None):
        """Send a message to the Fast-Agent server."""
        if not self.websocket:
            logger.error("Not connected to server")
            return False

        message = {
            "type": message_type,
            "message_id": str(uuid.uuid4())
        }
        
        if data:
            message["data"] = data
            
        try:
            await self.websocket.send(json.dumps(message))
            logger.info(f"Sent {message_type} message")
            return True
        except Exception as e:
            logger.error(f"Failed to send {message_type}: {e}")
            return False

    async def receive_messages(self, timeout=10, max_messages=5):
        """Receive and log messages from the server with a timeout."""
        if not self.websocket:
            logger.error("Not connected to server")
            return

        try:
            count = 0
            while count < max_messages:
                # Set a timeout for receiving messages
                response = await asyncio.wait_for(self.websocket.recv(), timeout)
                parsed = json.loads(response)
                logger.info(f"Received: {json.dumps(parsed, indent=2)}")
                count += 1
                
                # If we receive a thinking_complete message, break the loop
                if parsed.get("type") == "thinking_complete":
                    logger.info("Received thinking_complete message, ending receive loop")
                    break
                    
        except asyncio.TimeoutError:
            logger.warning(f"No response received after {timeout} seconds")
        except Exception as e:
            logger.error(f"Error receiving message: {e}")

    async def close(self):
        """Close the WebSocket connection."""
        if self.websocket:
            await self.websocket.close()
            logger.info("Connection closed")

async def run_test():
    # Initialize client
    client = FastAgentClient()
    
    # Connect to server
    if not await client.connect():
        return
    
    try:
        # First wait for connection_established message
        await client.receive_messages(timeout=5, max_messages=1)
        
        # Send ping message
        logger.info("Sending ping message...")
        await client.send_message("ping", {"timestamp": 1629000000000})
        await client.receive_messages(timeout=5, max_messages=1)
        
        # Initialize agent
        logger.info("Initializing agent...")
        await client.send_message("initialize", {"client_info": {"name": "test-client"}})
        await client.receive_messages(timeout=5, max_messages=1)
        
        # Send user message
        logger.info("Sending user message...")
        await client.send_message("user_message", {"content": "Hello! What capabilities do you have?"})
        await client.receive_messages(timeout=10, max_messages=3)
        
        # Request message history
        logger.info("Requesting message history...")
        await client.send_message("request_history")
        await client.receive_messages(timeout=5, max_messages=1)
        
    finally:
        # Close connection
        await client.close()

if __name__ == "__main__":
    logger.info("Starting Fast-Agent test client")
    asyncio.run(run_test())