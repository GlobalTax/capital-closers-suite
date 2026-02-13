import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Message = { role: "user" | "assistant"; content: string };

export function useCRMAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    let assistantSoFar = "";

    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Sesión expirada"); setIsStreaming(false); return; }

      const allMessages = [...messages, userMsg].map(({ role, content }) => ({ role, content }));

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ messages: allMessages }),
          signal: controller.signal,
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Error desconocido" }));
        if (resp.status === 429) toast.error("Límite de solicitudes excedido. Espera unos segundos.");
        else if (resp.status === 402) toast.error("Créditos de IA agotados.");
        else toast.error(err.error || "Error del asistente");
        setIsStreaming(false);
        return;
      }

      if (!resp.body) { toast.error("Sin respuesta"); setIsStreaming(false); return; }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsert(content);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // flush remaining
      if (buffer.trim()) {
        for (let raw of buffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsert(content);
          } catch { /* ignore */ }
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.error("CRM Assistant error:", e);
        toast.error("Error de conexión con el asistente");
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [messages]);

  const clearHistory = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setIsStreaming(false);
  }, []);

  const stopStreaming = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setIsStreaming(false);
  }, []);

  return { messages, isStreaming, sendMessage, clearHistory, stopStreaming };
}
