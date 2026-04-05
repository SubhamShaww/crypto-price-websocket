const WebSocket = require('ws');

// Test script to verify WebSocket functionality
const ws = new WebSocket('ws://localhost:8000');

ws.on('open', () => {
  console.log('✅ Connected to WebSocket server');
});

ws.on('message', (data) => {
  try {
    const prices = JSON.parse(data.toString());
    console.log('📈 Received price update:', Object.keys(prices));
    console.log('💰 BTC/USDT:', prices.BTCUSDT?.lastPrice || 'N/A');
    console.log('💰 ETH/USDT:', prices.ETHUSDT?.lastPrice || 'N/A');
    console.log('💰 BNB/USDT:', prices.BNBUSDT?.lastPrice || 'N/A');
  } catch (err) {
    console.error('❌ Error parsing message:', err);
  }
});

ws.on('error', (err) => {
  console.error('❌ WebSocket error:', err);
});

ws.on('close', () => {
  console.log('🔌 Disconnected from WebSocket server');
});

// Test REST API
const http = require('http');

function testAPI(endpoint, description) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3000${endpoint}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`✅ ${description}:`, res.statusCode === 200 ? 'OK' : 'ERROR');
          if (json.data) {
            console.log(`   📊 Data keys:`, Object.keys(json.data));
          }
        } catch (err) {
          console.log(`❌ ${description}: Parse error`);
        }
        resolve();
      });
    });

    req.on('error', () => {
      console.log(`❌ ${description}: Connection failed`);
      resolve();
    });

    req.setTimeout(5000, () => {
      console.log(`⏰ ${description}: Timeout`);
      req.destroy();
      resolve();
    });
  });
}

// Run tests after a short delay
setTimeout(async () => {
  console.log('\n🧪 Testing REST API endpoints...\n');

  await testAPI('/health', 'Health check');
  await testAPI('/price', 'Get all prices');
  await testAPI('/price/btcusdt', 'Get BTC price');
  await testAPI('/price/invalid', 'Invalid symbol test');

  console.log('\n🎯 Test complete! Closing WebSocket connection...');
  ws.close();
}, 3000);