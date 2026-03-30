import { useState, useEffect, useCallback } from "react";

type OverlayId = "age" | "cookie" | "email" | "exitIntent" | "install";

const PRIORITY: OverlayId[] = ["age", "cookie", "email", "exitIntent", "install"];

let activeOverlay: OverlayId | null = null;
let pendingQueue: Set<OverlayId> = new Set();
let listeners: Set<() => void> = new Set();

function notify() {
  listeners.forEach((fn) => fn());
}

function processQueue() {
  if (activeOverlay) return;
  for (const id of PRIORITY) {
    if (pendingQueue.has(id)) {
      pendingQueue.delete(id);
      activeOverlay = id;
      notify();
      return;
    }
  }
}

export function requestOverlay(id: OverlayId) {
  if (activeOverlay === id) return;
  pendingQueue.add(id);
  processQueue();
}

export function releaseOverlay(id: OverlayId) {
  pendingQueue.delete(id);
  if (activeOverlay === id) {
    activeOverlay = null;
    notify();
    // Process next in queue after a brief delay for animation
    setTimeout(processQueue, 300);
  }
}

export function useOverlaySlot(id: OverlayId): boolean {
  const [visible, setVisible] = useState(false);

  const sync = useCallback(() => {
    setVisible(activeOverlay === id);
  }, [id]);

  useEffect(() => {
    listeners.add(sync);
    sync();
    return () => {
      listeners.delete(sync);
    };
  }, [sync]);

  return visible;
}
