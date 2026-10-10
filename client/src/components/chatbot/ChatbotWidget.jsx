
import { useEffect, useId, useRef, useState } from "react";
import {
  Leaf,
  Send,
  X,
  LoaderCircle,
} from "lucide-react";

function GeminiLogo({ className = "h-7 w-7" }) {
  const gradientId = `gemini-${useId().replace(/:/g, "")}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      aria-label="Gemini-style logo"
      role="img"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
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

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([welcomeMessage]);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, isOpen]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  async function sendMessage(event, suggestedMessage) {
    event?.preventDefault();

    const text = (suggestedMessage ?? message).trim();

    if (!text || loading) return;

    const userMessage = {
      role: "user",
      content: text,
    };

    // Send recent conversation messages for conversational context.
    const history = messages.slice(-8).map((item) => ({
      role: item.role,
      content: item.content,
    }));

    setMessages((previous) => [...previous, userMessage]);
    setMessage("");
    setLoading(true);

    try {
      // Attach the logged-in user's token, if available.
      const token = localStorage.getItem("ecotrack-token");

      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/api/chatbot`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: text,
          history,
        }),
      });

      // Handle both JSON responses and unexpected server responses.
      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "Server se valid response nahi mila. Please dobara try karein."
        );
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Aapka login session expire ho sakta hai. Dobara login karke try karein."
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "EcoBot abhi reply nahi kar pa raha hai."
        );
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.reply,
        },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            error.message ||
            "Server se connect nahi ho pa raha. Please dobara try karein.",
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function resetChat() {
    if (loading) return;

    setMessages([welcomeMessage]);
    setMessage("");
  }

  return (
    <div className="fixed bottom-5 right-5 z-[100] font-sans">
      {!isOpen && (

<button
  type="button"
  onClick={() => setIsOpen(true)}
  aria-label="Open EcoBot chat"
  className="group relative flex h-[68px] w-[68px] items-center justify-center rounded-full border border-slate-200 bg-white shadow-xl shadow-slate-900/15 transition duration-300 hover:scale-110 hover:bg-slate-50 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-200"
>
  <GeminiLogo className="h-10 w-10" />

  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-lime-400">
    <span className="h-2 w-2 rounded-full bg-emerald-800" />
  </span>

  <span className="absolute bottom-full right-0 mb-3 whitespace-nowrap rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
    Chat with EcoBot
  </span>
</button>

      )}

      {isOpen && (
        <section
          className="flex h-[min(580px,calc(100dvh-2rem))] w-[calc(100vw-2rem)] max-w-[390px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20"
          aria-label="EcoBot chatbot"
        >
          {/* Header */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-700 to-green-600 px-4 py-4 text-white">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <img
  src="/gemini-logo.svg"
  alt="Gemini"
  className="h-7 w-7"
/>
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-bold">EcoBot Assistant</h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-50">
                <span className="h-2 w-2 rounded-full bg-lime-300" />
                AI-powered waste management help
              </p>
            </div>

            <button
              type="button"
              onClick={resetChat}
              disabled={loading}
              title="New conversation"
              className="rounded-xl px-2 py-2 text-xs font-semibold text-white/90 hover:bg-white/15 disabled:opacity-50"
            >
              New chat
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="rounded-xl p-2 hover:bg-white/15"
            >
              <X size={21} />
            </button>
          </div>

          {/* Intro */}
          <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-900">
            <Leaf size={15} className="shrink-0" />
            <span>Let's work together for a cleaner planet.</span>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-3 py-4 sm:px-4">
            {messages.map((item, index) => {
              const isUser = item.role === "user";

              return (
                <div
                  key={`${index}-${item.role}`}
                  className={`flex items-end gap-2 ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                      <img
  src="/gemini-logo.svg"
  alt="Gemini"
  className="h-5 w-5"
/>
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-3 text-sm leading-6 ${
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
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                   <GeminiLogo className="h-5 w-5" />
                </div>

                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                  <LoaderCircle size={16} className="animate-spin" />
                  EcoBot is thinking...
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggested questions */}
          {messages.length === 1 && !loading && (
            <div className="space-y-2 border-t border-slate-100 bg-white px-3 py-3">
              <p className="text-xs font-semibold text-slate-500">
                Try asking
              </p>

              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={(event) => sendMessage(event, suggestion)}
                  className="block w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-left text-xs font-medium text-emerald-800 transition hover:bg-emerald-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Message input */}
          <form
            onSubmit={sendMessage}
            className="flex items-end gap-2 border-t border-slate-200 bg-white p-3"
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
              className="max-h-24 min-h-11 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />

            <button
              type="submit"
              disabled={!message.trim() || loading}
              aria-label="Send message"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Send size={18} />
            </button>
          </form>

          <div className="bg-white pb-2 text-center text-[10px] text-slate-400">
            EcoBot may make mistakes. Verify important information.
          </div>
        </section>
      )}
    </div>
  );
}
