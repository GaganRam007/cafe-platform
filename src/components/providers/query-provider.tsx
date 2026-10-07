"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { RealtimeMessage } from "@/types/cafe";
import { playAudioNotification } from "@/lib/utils";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 3, // 3 seconds
      refetchInterval: 5000, // Background fallback polling
      retry: 2,
    },
  },
});

interface RealtimeContextType {
  isConnected: boolean;
  lastEvent: RealtimeMessage | null;
  triggerSound: (type: "new_order" | "urgent" | "service") => void;
}

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  lastEvent: null,
  triggerSound: () => {},
});

export const useRealtime = () => useContext(RealtimeContext);

function RealtimeListener({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeMessage | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource("/api/realtime");

        eventSource.onopen = () => {
          setIsConnected(true);
        };

        eventSource.onmessage = (e) => {
          try {
            if (e.data.startsWith(":")) return; // heartbeat
            const msg: RealtimeMessage = JSON.parse(e.data);
            setLastEvent(msg);

            // Invalidate queries to refresh data across all views
            qc.invalidateQueries({ queryKey: ["dashboard_bootstrap"] });
            qc.invalidateQueries({ queryKey: ["customer_session"] });
            qc.invalidateQueries({ queryKey: ["orders"] });
            qc.invalidateQueries({ queryKey: ["tables"] });

            // Trigger audio alert on specific events
            if (msg.type === "ORDER_CREATED") {
              playAudioNotification("new_order");
            } else if (msg.type === "SERVICE_REQUEST_CREATED") {
              playAudioNotification("service");
            }
          } catch (err) {
            console.error("Failed to parse SSE payload", err);
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          eventSource?.close();
          retryTimeout = setTimeout(connectSSE, 4000);
        };
      } catch (err) {
        console.error("SSE connection setup failed", err);
        retryTimeout = setTimeout(connectSSE, 4000);
      }
    };

    connectSSE();

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      if (eventSource) eventSource.close();
    };
  }, [qc]);

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        lastEvent,
        triggerSound: playAudioNotification,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function CafeProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeListener>{children}</RealtimeListener>
    </QueryClientProvider>
  );
}
