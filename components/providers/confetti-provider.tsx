"use client";

import dynamic from "next/dynamic";

import { useConfettiStore } from "@/hooks/use-confetti-store";

const ReactConfetti = dynamic(() => import("react-confetti"), { ssr: false });

export const ConfettiProvider = () => {
  const confetti = useConfettiStore();

  if (!confetti.isOpen) return null;

  return (
    <ReactConfetti
      className="pointer-events-none z-[100]"
      numberOfPieces={500}
      recycle={false}
      onConfettiComplete={() => {
        confetti.onClose();
      }}
    />
  )
}