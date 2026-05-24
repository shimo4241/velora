"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useScrollLock } from "@/lib/scrollLock";

/**
 * ModalPortal — renders children directly into document.body.
 *
 * WHY: .app-tab-panel uses transform: translate3d(0,0,0) which creates a
 * new CSS stacking context. This traps position:fixed descendants, making
 * them position relative to the transformed ancestor instead of the viewport.
 * Portal escapes that context entirely so modals render at true viewport level.
 *
 * Body scroll is locked while mounted. The portal node is cleaned up on unmount.
 */
export function ModalPortal({ children }: { children: React.ReactNode }) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useScrollLock(true);

  useEffect(() => {
    // Create a dedicated container appended to body
    const node = document.createElement("div");
    node.setAttribute("data-velora-modal", "true");
    document.body.appendChild(node);

    // Defer the state update to avoid synchronous cascading renders
    const timeoutId = setTimeout(() => {
      setContainer(node);
    }, 0);

    return () => {
      clearTimeout(timeoutId);

      // Remove the portal node
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
    };
  }, []);

  if (!container) return null;
  return createPortal(children, container);
}
