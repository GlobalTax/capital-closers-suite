import { useState } from "react";
import { CRMAssistantButton } from "./CRMAssistantButton";
import { CRMAssistantPanel } from "./CRMAssistantPanel";
import { useCRMAssistant } from "@/hooks/useCRMAssistant";

export function CRMAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, isStreaming, sendMessage, clearHistory, stopStreaming } = useCRMAssistant();

  return (
    <>
      {isOpen && (
        <CRMAssistantPanel
          messages={messages}
          isStreaming={isStreaming}
          onSend={sendMessage}
          onClear={clearHistory}
          onClose={() => setIsOpen(false)}
          onStop={stopStreaming}
        />
      )}
      <CRMAssistantButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
    </>
  );
}
