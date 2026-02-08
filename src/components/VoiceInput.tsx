"use client";

import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

interface VoiceInputProps {
  onResult: (text: string) => void;
}

export function VoiceInput({ onResult }: VoiceInputProps) {
  const { isListening, isSupported, startListening, stopListening } =
    useSpeechRecognition();

  if (!isSupported) return null;

  const toggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(onResult);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
        isListening
          ? "bg-red-500 text-white animate-pulse"
          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
      }`}
      aria-label={isListening ? "音声入力を停止" : "音声入力を開始"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" x2="12" y1="19" y2="22" />
      </svg>
    </button>
  );
}
