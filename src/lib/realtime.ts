import { EventEmitter } from "events";
import { RealtimeMessage } from "@/types/cafe";

// Global singleton event emitter for realtime push across requests
declare global {
  // eslint-disable-next-line no-var
  var __realtimeEmitter: EventEmitter | undefined;
}

if (!global.__realtimeEmitter) {
  global.__realtimeEmitter = new EventEmitter();
  global.__realtimeEmitter.setMaxListeners(200);
}

const emitter = global.__realtimeEmitter;

export const RealtimeBus = {
  broadcast: (type: RealtimeMessage["type"], payload: unknown) => {
    const message: RealtimeMessage = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };
    emitter.emit("message", message);
  },

  subscribe: (callback: (event: RealtimeMessage) => void) => {
    emitter.on("message", callback);
    return () => {
      emitter.off("message", callback);
    };
  },
};
