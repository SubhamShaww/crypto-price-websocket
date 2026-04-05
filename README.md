# Crypto Price WebSocket Server

A Node.js application that connects to Binance's public WebSocket API to listen to live crypto prices for BTC/USDT, ETH/USDT, and BNB/USDT, and broadcasts these prices to connected clients via its own WebSocket server. Also provides a REST API for querying prices.

## Features

- **Multi-Pair Support**: Tracks BTC/USDT, ETH/USDT, and BNB/USDT in real-time
- **Binance Listener**: Connects to `wss://stream.binance.com:9443/ws/btcusdt@ticker/ethusdt@ticker/bnbusdt@ticker`
- **Data Extraction**: Extracts symbol, last price, 24h change percentage, and timestamp from Binance updates
- **Local WebSocket Server**: Runs on `ws://localhost:8000`, allowing multiple clients to connect and receive live price updates
- **REST API**: HTTP endpoints for querying latest prices
- **Rate Limiting**: API requests are rate-limited to 100 requests per minute
- **Connection Limits**: Maximum 100 concurrent WebSocket connections to prevent server overload
- **Real-time Broadcasting**: Continuously broadcasts the latest price data to all connected clients
- **Graceful Handling**: Manages client disconnections and connection limits automatically

## Installation

1. Ensure you have Node.js installed (version 14 or higher recommended)
2. Clone or download this project
3. Run `npm install` to install dependencies

## Usage

1. Start the server:
   ```
   npm start
   ```
2. The WebSocket server will start listening on `ws://localhost:8000`
3. The REST API will be available on `http://localhost:3000`

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

- **GET /price/:symbol** - Get price for a specific symbol
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
    "trackedSymbols": ["BTCUSDT", "ETHUSDT", "BNBUSDT"]
  }
  ```

### WebSocket API (ws://localhost:8000)

Connect a WebSocket client to receive real-time price updates:

```javascript
const ws = new WebSocket('ws://localhost:8000');

ws.onmessage = (event) => {
  const priceData = JSON.parse(event.data);
  console.log('Updated prices:', priceData);
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

## Flow

1. The application connects to Binance's WebSocket for BTC, ETH, and BNB
2. Upon receiving price updates, it parses and stores the latest data
3. The local WebSocket server broadcasts updates to all connected clients
4. Clients can also query prices via the REST API
5. Connection limits prevent server overload
6. Rate limiting protects the REST API

## Dependencies

- `ws`: WebSocket library for Node.js
- `express`: Web framework for REST API
- `express-rate-limit`: Rate limiting middleware

## Notes

- The application handles disconnections from both Binance and clients gracefully
- When max connections is reached, new clients are rejected with a close code
- REST API requests are rate-limited to 100 per minute per IP
- For production use, consider adding reconnection logic for the Binance WebSocket and persistent storage