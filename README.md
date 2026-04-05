# Crypto Price WebSocket Server (Node.js with Message Queue & Broadcast Channels)

A Node.js application that connects to Binance's public WebSocket API to listen to live crypto prices for BTC/USDT, ETH/USDT, and BNB/USDT, and broadcasts these prices to connected clients via its own WebSocket server. Features advanced message management using a custom MessageQueue (equivalent to asyncio.Queue) and BroadcastChannel system for efficient real-time communication.

## Features

- **MessageQueue System**: Custom async message queue (equivalent to Python's asyncio.Queue) for handling Binance messages
- **BroadcastChannel System**: Pub/sub pattern for efficient broadcasting to all connected WebSocket clients
- **Multi-Pair Support**: Tracks BTC/USDT, ETH/USDT, and BNB/USDT in real-time
- **Binance Listener**: Connects to `wss://stream.binance.com:9443/ws/btcusdt@ticker/ethusdt@ticker/bnbusdt@ticker`
- **Data Extraction**: Extracts symbol, last price, 24h change percentage, and timestamp from Binance updates
- **WebSocket Server**: Runs on `ws://localhost:8000`, allowing multiple clients to connect and receive live price updates
- **REST API**: HTTP endpoints for querying latest prices
- **Rate Limiting**: API requests are rate-limited to 100 requests per minute per IP
- **Connection Limits**: Maximum 100 concurrent WebSocket connections to prevent server overload
- **Real-time Broadcasting**: Continuously broadcasts the latest price data to all connected clients
- **Graceful Handling**: Manages client disconnections and connection limits automatically
- **Docker Containerization**: Fully containerized with Docker and docker-compose

## Installation

### Local Development

1. Ensure you have Node.js installed (version 14 or higher recommended)
2. Clone or download this project
3. Run `npm install` to install dependencies

### Docker Deployment

1. Ensure you have Docker and Docker Compose installed
2. Clone or download this project
3. Run `docker-compose up -d` to start the containerized application

## Usage

### Local Development

1. Start the server:
   ```bash
   npm start
   ```
2. For development with auto-restart:
   ```bash
   npm run dev
   ```
3. Test the functionality:
   ```bash
   npm test
   ```

### Docker

1. Build and start the containers:
   ```bash
   docker-compose up --build
   ```
2. Or run in background:
   ```bash
   docker-compose up -d --build
   ```
3. View logs:
   ```bash
   docker-compose logs -f
   ```
4. Stop the containers:
   ```bash
   docker-compose down
   ```

## Testing

Run the included test script to verify both WebSocket and REST API functionality:

```bash
npm test
```

This will:
- Connect to the WebSocket server and display received price updates
- Test all REST API endpoints
- Verify error handling for invalid requests

## API Endpoints

### REST API (http://localhost:3000)

- **GET /price** - Get all latest prices
  ```
  curl http://localhost:3000/price
  ```
  Response:
  ```json
  {
    "success": true,
    "data": {
      "BTCUSDT": {
        "symbol": "BTCUSDT",
        "lastPrice": 45000.00,
        "changePercent": 2.5,
        "timestamp": 1640995200000
      },
      "ETHUSDT": {...},
      "BNBUSDT": {...}
    },
    "timestamp": "2026-04-05T10:30:00.000Z"
  }
  ```

- **GET /price/{symbol}** - Get price for a specific symbol
  ```
  curl http://localhost:3000/price/btcusdt
  curl http://localhost:3000/price/ethusdt
  curl http://localhost:3000/price/bnbusdt
  ```

- **GET /health** - Health check and connection status
  ```
  curl http://localhost:3000/health
  ```
  Response:
  ```json
  {
    "status": "ok",
    "connectedClients": 5,
    "trackedSymbols": ["BTCUSDT", "ETHUSDT", "BNBUSDT"],
    "messageQueueSize": 0
  }
  ```

### WebSocket API (ws://localhost:8000)

Connect a WebSocket client to receive real-time price updates:

```javascript
const ws = new WebSocket('ws://localhost:8000');

ws.onopen = () => {
  console.log('Connected to price server');
};

ws.onmessage = (event) => {
  const priceData = JSON.parse(event.data);
  console.log('Updated prices:', priceData);
};

ws.onclose = () => {
  console.log('Disconnected from price server');
};
```

## Data Format

Clients will receive JSON data in the following format:

```json
{
  "BTCUSDT": {
    "symbol": "BTCUSDT",
    "lastPrice": 45000.00,
    "changePercent": 2.5,
    "timestamp": 1640995200000
  },
  "ETHUSDT": {
    "symbol": "ETHUSDT",
    "lastPrice": 3000.00,
    "changePercent": -1.2,
    "timestamp": 1640995200000
  },
  "BNBUSDT": {
    "symbol": "BNBUSDT",
    "lastPrice": 500.00,
    "changePercent": 1.8,
    "timestamp": 1640995200000
  }
}
```

## Configuration

Key settings you can modify in `app.js`:

```javascript
const REST_PORT = 3000;           // REST API port
const WS_PORT = 8000;             // WebSocket server port
const MAX_CONNECTIONS = 100;      // Max concurrent WS connections
// Rate limiting: 100 requests per minute
```

## Docker Configuration

### Dockerfile Features

- **Multi-stage build**: Optimized for production
- **Security**: Non-root user execution
- **Health checks**: Built-in health monitoring
- **Alpine Linux**: Lightweight base image

## Docker Configuration

### Dockerfile Features

- **Multi-stage build**: Optimized for production
- **Security**: Non-root user execution
- **Health checks**: Built-in health monitoring
- **Alpine Linux**: Lightweight base image

### Docker Compose

- **Port mapping**: REST API (3000) and WebSocket (8000)
- **Health checks**: Automatic container health monitoring
- **Restart policy**: Automatic restart on failure
- **Network isolation**: Dedicated Docker network

### Environment Variables

- `NODE_ENV`: Set to `production` in Docker environment

## Flow

1. **Startup**: Application initializes MessageQueue and BroadcastChannel systems
2. **Binance Connection**: Consumer puts incoming messages into async queue
3. **Message Processing**: Processor consumes from queue and broadcasts to all subscribers
4. **Client Connections**: WebSocket clients subscribe to broadcast channel
5. **Real-time Updates**: Price changes are immediately broadcast to all connected clients
6. **REST Access**: HTTP clients can query current prices with rate limiting

## Dependencies

- `ws`: WebSocket library for Node.js
- `express`: Web framework for REST API
- `express-rate-limit`: Rate limiting middleware

## Notes

- The application uses async/await patterns for all asynchronous operations
- MessageQueue ensures proper message ordering and backpressure handling
- BroadcastChannel provides efficient one-to-many communication
- Automatic cleanup of disconnected WebSocket clients
- Docker container includes health checks and proper security practices
- For production use, consider adding reconnection logic for the Binance WebSocket and persistent storage