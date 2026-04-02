"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ModalOptions {
  /** Clicking the backdrop closes the modal (default: true) */
  closeOnBackdrop?: boolean;
  /** Pressing Escape closes the modal (default: true) */
  closeOnEscape?: boolean;
}

interface ModalState {
  isOpen: boolean;
  content: ReactNode | null;
  options: ModalOptions;
}

interface ModalContextValue {
  state: ModalState;
  open: (content: ReactNode, options?: ModalOptions) => void;
  close: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ModalContext = createContext<ModalContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ModalState>({
    isOpen: false,
    content: null,
    options: {},
  });

  const open = useCallback((content: ReactNode, options: ModalOptions = {}) => {
    setState({
      isOpen: true,
      content,
      options: { closeOnBackdrop: true, closeOnEscape: true, ...options },
    });
  }, []);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false, content: null }));
  }, []);

  return (
    <ModalContext.Provider value={{ state, open, close }}>
      {children}
    </ModalContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used inside <ModalProvider>");
  return ctx;
}