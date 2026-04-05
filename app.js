const WebSocket = require('ws');
const express = require('express');
const rateLimit = require('express-rate-limit');
const MessageQueue = require('./messageQueue');
const BroadcastChannel = require('./broadcastChannel');

const app = express();
const REST_PORT = 3000;
const WS_PORT = 8000;
const MAX_CONNECTIONS = 100;

// Initialize message queue and broadcast channel
const messageQueue = new MessageQueue();
const broadcastChannel = new BroadcastChannel();

// Connect to Binance WebSocket for BTC/USDT, ETH/USDT, and BNB/USDT tickers
const binanceWs = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker/ethusdt@ticker/bnbusdt@ticker');

// Create local WebSocket server on port 8000
const server = new WebSocket.Server({ port: WS_PORT });

// Store latest prices for each symbol
let latestPrices = new Map();

// Rate limiting middleware for REST API
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Binance WebSocket consumer (puts messages into queue)
binanceWs.on('open', () => {
  console.log('Connected to Binance WebSocket (BTC, ETH, BNB)');
});

binanceWs.on('message', async (data) => {
  try {
    const message = JSON.parse(data.toString());
    await messageQueue.put(message);
  } catch (err) {
    console.error('Error parsing Binance message:', err);
  }
});

binanceWs.on('error', (err) => {
  console.error('Binance WebSocket error:', err);
});

binanceWs.on('close', () => {
  console.log('Binance WebSocket closed');
  // Optionally, implement reconnection logic here
});

// Message processor (consumes from queue and broadcasts)
async function messageProcessor() {
  while (true) {
    try {
      const message = await messageQueue.get();

      // Extract relevant data
      const { s: symbol, c: lastPrice, P: priceChangePercent, E: eventTime } = message;

      // Update latest prices
      latestPrices.set(symbol, {
        symbol,
        lastPrice: parseFloat(lastPrice),
        changePercent: parseFloat(priceChangePercent),
        timestamp: eventTime
      });

      // Broadcast updated prices to all connected clients via broadcast channel
      const dataToSend = Object.fromEntries(latestPrices);
      await broadcastChannel.broadcast(dataToSend);

    } catch (err) {
      console.error('Error processing message:', err);
    }
  }
}

// Start the message processor
messageProcessor().catch(console.error);

// REST API - Get latest prices
app.get('/price', apiLimiter, (req, res) => {
  const dataToSend = Object.fromEntries(latestPrices);
  res.json({
    success: true,
    data: dataToSend,
    timestamp: new Date().toISOString()
  });
});

// REST API - Get price for a specific symbol
app.get('/price/:symbol', apiLimiter, (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const priceData = latestPrices.get(symbol);

  if (!priceData) {
    return res.status(404).json({
      success: false,
      error: `Symbol ${symbol} not found. Available symbols: ${Array.from(latestPrices.keys()).join(', ')}`
    });
  }

  res.json({
    success: true,
    data: priceData,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connectedClients: broadcastChannel.getSubscriberCount(),
    trackedSymbols: Array.from(latestPrices.keys()),
    messageQueueSize: messageQueue.size()
  });
});

// Handle local WebSocket server connections with connection limit
server.on('connection', (ws) => {
  // Check connection limit
  if (broadcastChannel.getSubscriberCount() >= MAX_CONNECTIONS) {
    ws.close(1008, 'Server at maximum connection capacity');
    console.log('Connection rejected: max connections reached');
    return;
  }

  console.log(`Client connected (${broadcastChannel.getSubscriberCount() + 1}/${MAX_CONNECTIONS})`);

  // Subscribe to broadcast channel
  const unsubscribe = broadcastChannel.subscribe(ws);

  // Send current latest prices to the new client
  const dataToSend = Object.fromEntries(latestPrices);
  ws.send(JSON.stringify(dataToSend));

  ws.on('close', () => {
    console.log(`Client disconnected (${broadcastChannel.getSubscriberCount() - 1}/${MAX_CONNECTIONS})`);
    unsubscribe();
  });

  ws.on('error', (err) => {
    console.error('Client WebSocket error:', err);
    unsubscribe();
  });
});

// Start Express server
app.listen(REST_PORT, () => {
  console.log(`REST API running on http://localhost:${REST_PORT}`);
  console.log(`  GET /price - Get all prices`);
  console.log(`  GET /price/:symbol - Get price for specific symbol`);
  console.log(`  GET /health - Health check`);
});

console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);
console.log(`Max WebSocket connections: ${MAX_CONNECTIONS}`);
console.log('Message queue and broadcast channel system initialized');