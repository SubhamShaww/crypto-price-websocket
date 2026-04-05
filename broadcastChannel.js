const WebSocket = require('ws');
const EventEmitter = require('events');

/**
 * BroadcastChannel
 * 
 * A pub/sub pattern implementation for broadcasting messages to multiple subscribers.
 * Equivalent to Python's broadcast channels.
 */
class BroadcastChannel extends EventEmitter {
  constructor() {
    super();
    this.subscribers = new Set();
    this.messageCount = 0;
  }

  /**
   * Subscribe a client to the broadcast channel
   * @param {WebSocket} subscriber - The WebSocket client to subscribe
   * @returns {Function} Unsubscribe function
   */
  subscribe(subscriber) {
    this.subscribers.add(subscriber);
    this.emit('subscriber-joined', { count: this.subscribers.size });
    return () => this.unsubscribe(subscriber);
  }

  /**
   * Unsubscribe a client from the broadcast channel
   * @param {WebSocket} subscriber - The WebSocket client to unsubscribe
   */
  unsubscribe(subscriber) {
    const hadSubscriber = this.subscribers.has(subscriber);
    this.subscribers.delete(subscriber);
    if (hadSubscriber) {
      this.emit('subscriber-left', { count: this.subscribers.size });
    }
  }

  /**
   * Broadcast a message to all connected subscribers
   * @param {*} message - The message to broadcast
   * @returns {Promise<Object>} Result of broadcast with success count and failed count
   */
  async broadcast(message) {
    this.messageCount++;
    const promises = Array.from(this.subscribers).map(async (subscriber) => {
      try {
        if (subscriber.readyState === WebSocket.OPEN) {
          await new Promise((resolve, reject) => {
            subscriber.send(JSON.stringify(message), (error) => {
              if (error) reject(error);
              else resolve();
            });
          });
          return { success: true };
        }
      } catch (error) {
        console.error('Broadcast error:', error.message);
        this.unsubscribe(subscriber);
        return { success: false, error: error.message };
      }
    });

    const results = await Promise.allSettled(promises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failedCount = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

    this.emit('broadcast-complete', { 
      messageCount: this.messageCount,
      successCount, 
      failedCount,
      totalSubscribers: this.subscribers.size 
    });

    return { successCount, failedCount, totalSubscribers: this.subscribers.size };
  }

  /**
   * Get the number of active subscribers
   * @returns {number} Number of connected subscribers
   */
  getSubscriberCount() {
    return this.subscribers.size;
  }

  /**
   * Get list of active subscribers (for debugging)
   * @returns {Array} Array of subscribers
   */
  getSubscribers() {
    return Array.from(this.subscribers);
  }

  /**
   * Check if a specific subscriber is connected
   * @param {WebSocket} subscriber - The subscriber to check
   * @returns {boolean} True if subscriber is connected
   */
  hasSubscriber(subscriber) {
    return this.subscribers.has(subscriber);
  }

  /**
   * Get broadcast statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      subscriberCount: this.subscribers.size,
      totalMessagesOnBroadcast: this.messageCount,
      activeConnections: Array.from(this.subscribers).filter(s => s.readyState === WebSocket.OPEN).length
    };
  }

  /**
   * Clear all subscribers
   */
  clearSubscribers() {
    this.subscribers.clear();
  }
}

module.exports = BroadcastChannel;