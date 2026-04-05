/**
 * MessageQueue
 * 
 * An async queue system equivalent to Python's asyncio.Queue.
 * Provides a thread-safe queue for handling messages between producers and consumers.
 */
class MessageQueue {
  constructor() {
    this.queue = [];
    this.waiting = [];
    this.processing = false;
  }

  /**
   * Put an item into the queue
   * @param {*} item - The item to add to the queue
   */
  async put(item) {
    this.queue.push(item);
    this._notify();
  }

  /**
   * Get an item from the queue
   * If queue is empty, waits for an item to be available
   * @returns {Promise<*>} The next item in the queue
   */
  async get() {
    if (this.queue.length === 0) {
      await new Promise(resolve => this.waiting.push(resolve));
    }
    return this.queue.shift();
  }

  /**
   * Notify waiting consumers that an item is available
   * @private
   */
  _notify() {
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift();
      resolve();
    }
  }

  /**
   * Get the current size of the queue
   * @returns {number} Number of items in the queue
   */
  size() {
    return this.queue.length;
  }

  /**
   * Get the number of consumers waiting for items
   * @returns {number} Number of waiting consumers
   */
  waitingCount() {
    return this.waiting.length;
  }

  /**
   * Clear all items from the queue
   */
  clear() {
    this.queue = [];
  }

  /**
   * Check if queue is empty
   * @returns {boolean} True if queue is empty
   */
  isEmpty() {
    return this.queue.length === 0;
  }
}

module.exports = MessageQueue;