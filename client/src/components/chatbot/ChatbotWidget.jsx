import { useEffect, useId, useRef, useState } from "react";
import { Leaf, Send, X, LoaderCircle } from "lucide-react";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const welcomeMessage = {
  role: "assistant",
  content:
    "Namaste! 🌿 Main EcoBot hoon. Aap garbage reporting, waste segregation, recycling aur pickup booking ke baare mein mujhse pooch sakte hain.",
};

const suggestions = [
  "Garbage report kaise karein?",
  "Wet aur dry waste mein kya difference hai?",
  "Issue ka status kaise check karein?",
  "Mera next pickup kab hai?",
];

function GeminiLogo({ className = "h-7 w-7" }) {
  const gradientId = `gemini-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label="Gemini-inspired logo"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="48%" stopColor="#9B72CB" />
          <stop offset="100%" stopColor="#D96570" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradientId})`}
        d="M12 1.5 C13.4 7.8 16.2 10.6 22.5 12 C16.2 13.4 13.4 16.2 12 22.5 C10.6 16.2 7.8 13.4 1.5 12 C7.8 10.6 10.6 7.8 12 1.5 Z"
      />
    </svg>
  );
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([welcomeMessage]);
  const [loading, setLoading] = useState(false);
  const [viewport, setViewport] = useState({
    width: 1024,
    height: 768,
    layoutHeight: 768,
    offsetTop: 0,
  });

  const bottomRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const updateViewport = () => {
      const visual = window.visualViewport;
      setViewport({
        width: window.innerWidth,
        height: visual?.height ?? window.innerHeight,
        layoutHeight: window.innerHeight,
        offsetTop: visual?.offsetTop ?? 0,
      });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    window.visualViewport?.addEventListener("resize", updateViewport);
    window.visualViewport?.addEventListener("scroll", updateViewport);

    return () => {
      window.removeEventListener("resize", updateViewport);
      window.visualViewport?.removeEventListener("resize", updateViewport);
      window.visualViewport?.removeEventListener("scroll", updateViewport);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !messagesContainerRef.current) return;
    const container = messagesContainerRef.current;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, loading, isOpen]);

  useEffect(() => {
    if (isOpen) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 100);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape") setIsOpen(false);
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const isSmallScreen = viewport.width < 640;
  const keyboardLikelyOpen =
    isSmallScreen && viewport.height < viewport.layoutHeight - 120;

  const keyboardWindowStyle = keyboardLikelyOpen
    ? {
        left: "8px",
        right: "8px",
        top: `${Math.max(8, viewport.offsetTop + 8)}px`,
        bottom: "auto",
        width: "auto",
        height: `${Math.max(180, Math.min(620, viewport.height - 16))}px`,
        maxHeight: `${Math.max(180, viewport.height - 16)}px`,
      }
    : undefined;

  async function sendMessage(event, suggestedMessage) {
    event?.preventDefault();
    const text = (suggestedMessage ?? message).trim();

    if (!text || loading) return;

    const userMessage = { role: "user", content: text };
    const history = messages.slice(-8).map((item) => ({
      role: item.role,
      content: item.content,
    }));

    setMessages((previous) => [...previous, userMessage]);
    setMessage("");
    setLoading(true);

    try {
      const token = localStorage.getItem("ecotrack-token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${API_BASE}/api/chatbot`, {
        method: "POST",
        headers,
        body: JSON.stringify({ message: text, history }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Server se valid response nahi mila. Dobara try karein.");
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Login session expire ho sakta hai. Dobara login karke try karein."
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "EcoBot abhi reply nahi kar pa raha hai.");
      }

      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: data.reply },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            error?.message ||
            "Server se connect nahi ho pa raha. Please dobara try karein.",
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function resetChat() {
    if (loading) return;
    setMessages([welcomeMessage]);
    setMessage("");
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-visible">
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open EcoBot chat"
          className="pointer-events-auto fixed bottom-4 right-4 flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white shadow-xl shadow-slate-900/15 transition hover:scale-105 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-500 sm:bottom-5 sm:right-5 sm:h-[68px] sm:w-[68px]"
        >
          <GeminiLogo className="h-9 w-9 sm:h-10 sm:w-10" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-lime-400 sm:h-5 sm:w-5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-800 sm:h-2 sm:w-2" />
          </span>
        </button>
      )}

      {isOpen && (
        <section
          aria-label="EcoBot chatbot"
          aria-modal="false"
          className="pointer-events-auto fixed inset-x-2 bottom-2 flex h-[min(620px,calc(100dvh-1rem))] min-h-0 w-auto max-w-none flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/25 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:h-[min(620px,calc(100dvh-2.5rem))] sm:w-[min(390px,calc(100vw-2.5rem))] sm:max-w-[390px] sm:rounded-3xl"
          style={keyboardWindowStyle}
        >
          <header className="flex min-w-0 shrink-0 items-center gap-2 bg-gradient-to-r from-emerald-800 to-green-600 px-3 py-3 text-white sm:gap-3 sm:px-4 sm:py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 sm:h-11 sm:w-11 sm:rounded-2xl">
              <GeminiLogo className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-bold sm:text-base">EcoBot Assistant</h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-emerald-50 sm:text-xs">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-lime-300 sm:h-2 sm:w-2" />
                <span className="truncate">AI-powered waste management help</span>
              </p>
            </div>

            <button
              type="button"
              onClick={resetChat}
              disabled={loading}
              title="New conversation"
              aria-label="Start a new conversation"
              className="shrink-0 rounded-lg px-1.5 py-2 text-[11px] font-semibold text-white/95 hover:bg-white/15 disabled:opacity-50 sm:px-2 sm:text-xs"
            >
              <span className="sm:hidden">New</span>
              <span className="hidden sm:inline">New chat</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-white/15 sm:h-9 sm:w-9"
            >
              <X size={20} />
            </button>
          </header>

          <div className="flex shrink-0 items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-900 sm:px-4 sm:text-xs">
            <Leaf size={14} className="shrink-0" />
            <span className="truncate">Let's work together for a cleaner planet.</span>
          </div>

          <div ref={messagesContainerRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-slate-50 px-3 py-3 sm:space-y-4 sm:px-4 sm:py-4">
            {messages.map((item, index) => {
              const isUser = item.role === "user";
              return (
                <div
                  key={`${index}-${item.role}`}
                  className={`flex min-w-0 items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm sm:h-8 sm:w-8 sm:rounded-xl">
                      <GeminiLogo className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2.5 text-[13px] leading-5 sm:max-w-[85%] sm:px-3.5 sm:py-3 sm:text-sm sm:leading-6 ${
                      isUser
                        ? "rounded-br-md bg-emerald-600 text-white"
                        : item.error
                          ? "rounded-bl-md border border-amber-200 bg-amber-50 text-amber-900"
                          : "rounded-bl-md border border-slate-200 bg-white text-slate-700 shadow-sm"
                    }`}
                  >
                    {item.content}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-end gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm sm:h-8 sm:w-8 sm:rounded-xl">
                  <GeminiLogo className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-500 shadow-sm sm:px-4 sm:py-3 sm:text-sm">
                  <LoaderCircle size={16} className="animate-spin" />
                  EcoBot is thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length === 1 && !loading && (
            <div className="shrink-0 space-y-1.5 border-t border-slate-100 bg-white px-3 py-2.5 sm:space-y-2 sm:px-3 sm:py-3">
              <p className="text-[11px] font-semibold text-slate-500 sm:text-xs">Try asking</p>
              {suggestions.slice(0, isSmallScreen ? 3 : suggestions.length).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={(event) => sendMessage(event, suggestion)}
                  className="block min-h-9 w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-left text-[11px] font-medium leading-4 text-emerald-800 transition hover:bg-emerald-50 sm:text-xs"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={sendMessage}
            className="flex shrink-0 items-end gap-2 border-t border-slate-200 bg-white p-2.5 sm:p-3"
            style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
          >
            <textarea
              ref={inputRef}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  sendMessage(event);
                }
              }}
              placeholder="Type your message..."
              aria-label="Type your message"
              rows={1}
              maxLength={1000}
              className="max-h-24 min-h-10 min-w-0 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] leading-5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 sm:min-h-11 sm:rounded-2xl sm:px-3.5 sm:py-3 sm:text-sm"
            />
            <button
              type="submit"
              disabled={!message.trim() || loading}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:h-11 sm:w-11 sm:rounded-2xl"
            >
              <Send size={17} />
            </button>
          </form>

          <div className="shrink-0 bg-white pb-1.5 text-center text-[9px] text-slate-400 sm:pb-2 sm:text-[10px]">
            EcoBot may make mistakes. Verify important information.
          </div>
        </section>
      )}
    </div>
  );
}
