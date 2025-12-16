// test-redis.js
const Redis = require("ioredis");

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully!');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

async function testRedis() {
  try {
    // Test PING
    const pong = await redis.ping();
    console.log('PING response:', pong);

    // Test SET
    await redis.set('test:key', 'Hello Redis from Node.js!');
    console.log('✅ SET test:key successful');

    // Test GET
    const value = await redis.get('test:key');
    console.log('GET test:key:', value);

    // Test SETEX (với TTL)
    await redis.setex('test:ttl', 60, 'This expires in 60 seconds');
    console.log('✅ SETEX test:ttl successful');

    // Test TTL
    const ttl = await redis.ttl('test:ttl');
    console.log('TTL for test:ttl:', ttl, 'seconds');

    // Test DELETE
    await redis.del('test:key', 'test:ttl');
    console.log('✅ Cleaned up test keys');

    console.log('\n🎉 All Redis tests passed!');
    
    // Đóng kết nối
    await redis.quit();
    process.exit(0);
  } catch (error) {
    console.error('❌ Redis test failed:', error);
    process.exit(1);
  }
}

// Chạy test
testRedis();