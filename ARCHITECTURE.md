# Project Structure Documentation

## File Organization

This project is organized into modular components for better maintainability and testing:

### Core Application Files

#### `app.js` - Main Application
The main entry point that orchestrates the entire application:
- Initializes Express server (REST API on port 3000)
- Sets up WebSocket server (port 8000)
- Connects to Binance WebSocket API
- Implements message processing logic
- Manages client connections and broadcasting

**Key Responsibilities:**
- Binance WebSocket consumer
- Message processor (consumes from queue and broadcasts)
- REST API endpoints (`/price`, `/price/:symbol`, `/health`)
- WebSocket connection handler
- Express server initialization

---

#### `messageQueue.js` - Message Queue Module
A standalone async queue implementation (equivalent to Python's `asyncio.Queue`).

**Class: MessageQueue**
- `put(item)` - Add an item to the queue
- `get()` - Remove and return the next item (waits if empty)
- `size()` - Get current queue size
- `waitingCount()` - Get number of waiting consumers
- `isEmpty()` - Check if queue is empty
- `clear()` - Clear all items from the queue

**Use Case:**
- Decouples Binance message consumption from processing
- Prevents message loss under high throughput
- Enables backpressure handling

**Example:**
```javascript
const messageQueue = new MessageQueue();

// Producer
await messageQueue.put({ symbol: 'BTCUSDT', price: 45000 });

// Consumer
const message = await messageQueue.get();
```

---

#### `broadcastChannel.js` - Broadcast Channel Module
A pub/sub pattern implementation for one-to-many message distribution.

**Class: BroadcastChannel**
- `subscribe(subscriber)` - Add a subscriber and return unsubscribe function
- `unsubscribe(subscriber)` - Remove a subscriber
- `broadcast(message)` - Send message to all subscribers
- `getSubscriberCount()` - Get number of active subscribers
- `getSubscribers()` - Get list of all subscribers
- `hasSubscriber(subscriber)` - Check if a subscriber is active
- `getStats()` - Get channel statistics
- `clearSubscribers()` - Remove all subscribers

**Features:**
- Automatic error handling and cleanup of dead connections
- Event emission for subscriber lifecycle events (`subscriber-joined`, `subscriber-left`)
- Broadcast completion events with success/failure counts
- Support for debugging and monitoring

**Use Case:**
- Efficiently broadcasts price updates to all connected WebSocket clients
- Decouples message production from client management
- Enables clean connection lifecycle handling

**Example:**
```javascript
const broadcastChannel = new BroadcastChannel();

// Client subscribes
const unsubscribe = broadcastChannel.subscribe(wsClient);

// Broadcast to all subscribers
await broadcastChannel.broadcast({ prices: {...} });

// Client unsubscribes
unsubscribe();
```

---

### Supporting Files

#### `package.json`
- NPM package metadata
- Project dependencies
- Scripts for running, testing, and development

#### `Dockerfile`
- Container configuration for Docker deployment
- Uses Node.js 18 Alpine for minimal size
- Includes health checks and security settings

#### `docker-compose.yml`
- Docker Compose configuration
- Service orchestration
- Port mappings and networking

#### `.gitignore`
- Git ignore patterns for version control

#### `.dockerignore`
- Docker build ignore patterns

#### `test.js`
- Test script for validating functionality
- Tests WebSocket and REST API endpoints

#### `README.md`
- Project documentation
- Installation and usage instructions
- API reference and examples

---

## Message Flow Diagram

```
Binance WebSocket
    ↓
binanceWs.on('message')
    ↓
messageQueue.put(data)
    ↓
messageProcessor()
    ↓
messageQueue.get()
    ↓
Process & Update latestPrices
    ↓
broadcastChannel.broadcast(prices)
    ↓
WebSocket Clients (via server.on('connection'))
```

---

## Architecture Benefits

### Separation of Concerns
- **MessageQueue**: Handles async message buffering
- **BroadcastChannel**: Handles client communication
- **app.js**: Orchestrates business logic

### Testability
- Each module can be tested independently
- Modules export ES6 classes for easy mocking

### Reusability
- `MessageQueue` and `BroadcastChannel` can be used in other projects
- Clear API contracts with JSDoc documentation

### Maintainability
- Smaller, focused files are easier to understand
- Changes are isolated to specific modules
- Easier to debug and add features

---

## Imports in app.js

```javascript
const MessageQueue = require('./messageQueue');
const BroadcastChannel = require('./broadcastChannel');

const messageQueue = new MessageQueue();
const broadcastChannel = new BroadcastChannel();
```

---

## Future Enhancements

1. **Event-driven Monitoring**
   - Subscribe to broadcast channel events for analytics
   - Log subscriber lifecycle events
   - Monitor message throughput

2. **Rate Limiting per Client**
   - Track message consumption per client
   - Implement per-client backpressure

3. **Message Persistence**
   - Store messages in database
   - Implement message replay capabilities

4. **Clustering**
   - Run multiple app.js instances
   - Share message queue via Redis
   - Share broadcast channel state via Redis

5. **Unit Tests**
   - Test MessageQueue independently
   - Test BroadcastChannel independently
   - Test app.js integration