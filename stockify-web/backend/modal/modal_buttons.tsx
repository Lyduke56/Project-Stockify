"use client";

import { useModal } from "../../backend/modal/modal_context";
import type { ReactNode } from "react";
import type { ModalOptions } from "../../backend/modal/modal_context";

// OPEN MODAL ON BUTTON CLICK
interface OpenModalButtonProps {
  modal: ReactNode;           // swap this for any modal component
  options?: ModalOptions;
  children: ReactNode;
  className?: string;
}

export function OpenModalButton({
  modal,
  options,
  children,
  className,
}: OpenModalButtonProps) {
  const { open } = useModal();

  return (
    <button className={className} onClick={() => open(modal, options)}>
      {children}
    </button>
  );
}

// CLOSE MODAL ON BUTTON CLICK
interface CloseModalButtonProps {
  children?: ReactNode;       // defaults to "✕" if omitted
  className?: string;
  onClose?: () => void;       // optional side-effect before closing
}

export function CloseModalButton({
  children = "✕",
  className,
  onClose,
}: CloseModalButtonProps) {
  const { close } = useModal();

  const handleClick = () => {
    onClose?.();
    close();
  };

  return (
    <button
      className={className}
      onClick={handleClick}
      aria-label="Close modal"
    >
      {children}
    </button>
  );
}