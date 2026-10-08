import { EventEmitter } from "events";
import { RealtimeMessage } from "@/types/cafe";
import Redis from "ioredis";

// Global singleton event emitter for realtime push across requests
declare global {
  // eslint-disable-next-line no-var
  var __realtimeEmitter: EventEmitter | undefined;
  // eslint-disable-next-line no-var
  var __redisPub: Redis | undefined;
  // eslint-disable-next-line no-var
  var __redisSub: Redis | undefined;
}

if (!global.__realtimeEmitter) {
  global.__realtimeEmitter = new EventEmitter();
  global.__realtimeEmitter.setMaxListeners(300);
}

const emitter = global.__realtimeEmitter;

// Optional Redis Pub/Sub Integration for Multi-Instance / Clustered Next.js
const REDIS_URL = process.env.REDIS_URL;
let redisPublisher: Redis | null = null;
let redisSubscriber: Redis | null = null;

if (REDIS_URL) {
  try {
    if (!global.__redisPub) {
      global.__redisPub = new Redis(REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
      global.__redisPub.connect().catch(() => console.warn("Redis pub connection failed, falling back to in-memory bus"));
    }
    if (!global.__redisSub) {
      global.__redisSub = new Redis(REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
      global.__redisSub.connect().catch(() => console.warn("Redis sub connection failed, falling back to in-memory bus"));
      global.__redisSub.subscribe("aura_cafe_events", (err) => {
        if (!err) console.log("Subscribed to Redis channel: aura_cafe_events");
      });
      global.__redisSub.on("message", (_channel, message) => {
        try {
          const parsed = JSON.parse(message);
          emitter.emit("message", parsed);
        } catch {
          // ignore parse errors
        }
      });
    }
    redisPublisher = global.__redisPub;
    redisSubscriber = global.__redisSub;
  } catch (err) {
    console.warn("Failed to initialize Redis pub/sub; running on in-process EventEmitter", err);
  }
}

export const RealtimeBus = {
  broadcast: (type: RealtimeMessage["type"], payload: unknown, targetScope?: { tableId?: string; role?: string }) => {
    const message: RealtimeMessage = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };

    // Forward to local in-process subscribers
    emitter.emit("message", { ...message, _scope: targetScope });

    // Forward to distributed Redis cluster if connected
    if (redisPublisher && redisPublisher.status === "ready") {
      redisPublisher.publish("aura_cafe_events", JSON.stringify({ ...message, _scope: targetScope })).catch(() => {});
    }
  },

  subscribe: (callback: (event: RealtimeMessage & { _scope?: { tableId?: string; role?: string } }) => void) => {
    emitter.on("message", callback);
    return () => {
      emitter.off("message", callback);
    };
  },
};
