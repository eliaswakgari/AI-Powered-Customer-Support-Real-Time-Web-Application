import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { api } from "../api";
import { getSocket } from "../lib/socket";

interface Chat {
  _id: string;
  status: "open" | "pending" | "closed" | "escalated";
}

interface Attachment {
  url: string;
  publicId: string;
  filename?: string;
  mimeType?: string;
  size?: number;
}

interface Message {
  _id: string;
  chat: string;
  sender: string;
  senderRole: "admin" | "agent" | "customer";
  text: string;
  sentiment?: "positive" | "neutral" | "negative";
  createdAt: string;
  attachment?: Attachment;
}

const DashboardPage: React.FC = () => {
  const { token, role } = useSelector((s: RootState) => s.auth);

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSentiment, setFilterSentiment] = useState("");

  const [showAnalytics, setShowAnalytics] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // helper: scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // -----------------------
  // LOAD CHATS
  // -----------------------
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const loadChats = async () => {
      setLoadingChats(true);
      setError(null);
      try {
        let res;
        if (role === "customer") {
          res = await api.get<Chat[]>("/chats");
        } else {
          const params: Record<string, string> = {};
          if (searchQuery.trim()) params.q = searchQuery.trim();
          if (filterStatus) params.status = filterStatus;
          if (filterSentiment) params.sentiment = filterSentiment;
          res = await api.get<Chat[]>("/search/chats", { params });
        }

        if (!cancelled) {
          const data = res.data;
          setChats(data);
          if (data.length > 0 && !activeChatId) setActiveChatId(data[0]._id);
          if (data.length === 0) setActiveChatId(null);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.response?.data?.message || "Failed to load chats");
      } finally {
        if (!cancelled) setLoadingChats(false);
      }
    };

    const ensureCustomerChat = async () => {
      setLoadingChats(true);
      setError(null);
      try {
        const res = await api.post<Chat>("/chats");
        if (!cancelled) {
          setChats([res.data]);
          setActiveChatId(res.data._id);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.response?.data?.message || "Failed to create chat");
      } finally {
        if (!cancelled) setLoadingChats(false);
      }
    };

    if (role === "customer") ensureCustomerChat();
    else loadChats();

    return () => {
      cancelled = true;
    };
    // note: intentionally not including activeChatId to avoid refetch loops from setActiveChatId
    // other filters/search should re-run fetches
  }, [token, role, searchQuery, filterStatus, filterSentiment]);

  // -----------------------
  // LOAD MESSAGES
  // -----------------------
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    const loadMessages = async () => {
      setLoadingMessages(true);
      setError(null);
      try {
        const res = await api.get<Message[]>(`/chats/${activeChatId}/messages`);
        if (!cancelled) {
          setMessages(res.data);
          setTimeout(scrollToBottom, 50);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.response?.data?.message || "Failed to load messages");
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    };

    loadMessages();
    return () => {
      cancelled = true;
    };
  }, [activeChatId]);

  // -----------------------
  // SOCKET: join/leave + events
  // -----------------------
  useEffect(() => {
    if (!token) return;

    const socket = getSocket(token);
    socketRef.current = socket;

    const onGlobalNewMessage = (msg: Message) => {
      // if message belongs to current chat append, else just bump unread
      setMessages((prev) => {
        if (msg.chat === activeChatId) {
          if (prev.find((m) => m._id === msg._id)) return prev;
          // append
          setTimeout(scrollToBottom, 50);
          return [...prev, msg];
        }
        return prev;
      });

      if (msg.senderRole !== role) setUnreadCount((u) => u + 1);
    };

    const onGlobalTyping = (payload: { chatId: string; userId?: string }) => {
      if (payload.chatId === activeChatId) {
        setTypingUserId(payload.userId || null);
        setTimeout(() => setTypingUserId(null), 1500);
      }
    };

    socket.on("new-message", onGlobalNewMessage);
    socket.on("typing", onGlobalTyping);

    // join current chat if exists
    if (activeChatId) {
      socket.emit("join-chat", activeChatId);
    }

    // when activeChatId changes, emit join/leave appropriately
    const prevChatRef = { current: activeChatId };

    return () => {
      // leave previously joined chat
      if (activeChatId) socket.emit("leave-chat", activeChatId);
      socket.off("new-message", onGlobalNewMessage);
      socket.off("typing", onGlobalTyping);
      // do not disconnect socket here (shared across app); if you want to disconnect do it explicitly
    };
    // we want to re-run when token or activeChatId changes (joins/leaves)
  }, [token, activeChatId, role]);

  // -----------------------
  // SMART REPLIES
  // -----------------------
  useEffect(() => {
    if (!activeChatId || role === "customer" || messages.length === 0) {
      setSmartReplies([]);
      return;
    }

    const lastCustomerMsg = [...messages].reverse().find((m) => m.senderRole === "customer" && m.text?.trim());
    if (!lastCustomerMsg) {
      setSmartReplies([]);
      return;
    }

    let cancelled = false;
    const loadSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
        const res = await api.post<{ text: string }[]>("/ml/suggestions", { text: lastCustomerMsg.text });
        if (!cancelled) setSmartReplies(res.data.map((s) => s.text));
      } catch {
        if (!cancelled) setSmartReplies([]);
      } finally {
        if (!cancelled) setLoadingSuggestions(false);
      }
    };

    loadSuggestions();
    return () => {
      cancelled = true;
    };
  }, [activeChatId, messages, role]);

  // -----------------------
  // SEND MESSAGE
  // -----------------------
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeChatId) return;
    if (!input.trim() && !file) return;

    setSending(true);
    setError(null);
    try {
      let res;
      if (file) {
        const form = new FormData();
        if (input.trim()) form.append("text", input.trim());
        form.append("attachment", file);
        res = await api.post<Message>(`/chats/${activeChatId}/messages`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await api.post<Message>(`/chats/${activeChatId}/messages`, { text: input.trim() });
      }

      // optimistic append (server also broadcasts via socket)
      setMessages((prev) => [...prev, res.data]);
      setInput("");
      setFile(null);
      setTimeout(scrollToBottom, 50);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    // emit typing
    if (!token || !activeChatId) return;
    socketRef.current?.emit("typing", { chatId: activeChatId });
  };

  // -----------------------
  // LOAD ANALYTICS
  // -----------------------
  const loadAnalytics = async () => {
    if (role !== "admin" && role !== "agent") return;
    setLoadingAnalytics(true);
    setAnalyticsError(null);
    try {
      const res = await api.get("/search/analytics/summary");
      setAnalytics(res.data);
    } catch (err: any) {
      setAnalyticsError(err?.response?.data?.message || "Failed to load analytics");
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // -----------------------
  // UI
  // -----------------------
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* LEFT: Sidebar */}
      <aside className="w-full md:w-80 border-r bg-white flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Dashboard</h1>
            <div className="text-xs text-slate-500">Signed in as <span className="font-medium">{role || "unknown"}</span></div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setUnreadCount(0)}
              className="relative rounded-full p-2 border bg-white"
              aria-label="Notifications"
            >
              <span>🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Sidebar content scrolls independently (Telegram-like) */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {/* only admins/agents see search/filters */}
          {role !== "customer" && (
            <form onSubmit={(e) => e.preventDefault()} className="space-y-2 text-[13px]">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by keyword..."
                className="w-full rounded border px-3 py-2 text-sm bg-slate-50"
              />

              <div className="flex gap-2">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="flex-1 rounded border px-2 py-1 text-sm bg-slate-50">
                  <option value="">All statuses</option>
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="closed">Closed</option>
                  <option value="escalated">Escalated</option>
                </select>

                <select value={filterSentiment} onChange={(e) => setFilterSentiment(e.target.value)} className="flex-1 rounded border px-2 py-1 text-sm bg-slate-50">
                  <option value="">All sentiments</option>
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="negative">Negative</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { /* filters are bound to useEffect */ }}
                  className="flex-1 rounded bg-indigo-600 text-white px-3 py-1 text-sm"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(""); setFilterStatus(""); setFilterSentiment(""); }}
                  className="flex-1 rounded border px-3 py-1 text-sm"
                >
                  Reset
                </button>
              </div>

              {role === "admin" && (
                <div className="pt-2">
                  <button
                    onClick={() => { setShowAnalytics((s) => !s); if (!showAnalytics) loadAnalytics(); }}
                    className="w-full rounded border px-3 py-1 text-sm"
                  >
                    {showAnalytics ? "Hide analytics" : "View analytics"}
                  </button>
                </div>
              )}
            </form>
          )}

          <div>
            {loadingChats ? (
              <div className="text-xs text-slate-500">Loading chats...</div>
            ) : chats.length === 0 ? (
              <div className="text-xs text-slate-500">No chats found</div>
            ) : (
              <ul className="space-y-2">
                {chats.map((chat) => (
                  <li key={chat._id}>
                    <button
                      onClick={() => setActiveChatId(chat._id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded text-left ${activeChatId === chat._id ? "bg-indigo-600 text-white" : "bg-slate-100"}`}
                    >
                      <span className="truncate">Chat {chat._id.slice(-6)}</span>
                      <span className="ml-2 text-[11px] uppercase">{chat.status}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </aside>

      {/* RIGHT: Chat area / analytics */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 p-4 flex flex-col overflow-hidden gap-4">
          {/* Error */}
          {error && <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          {!activeChatId && !loadingChats && (
            <div className="text-sm text-slate-500">No active chat yet. {role === "customer" ? "Creating your conversation..." : "Select a chat from the list."}</div>
          )}

          {/* Analytics (shown above chat, does not hide input) */}
          {showAnalytics && role !== "customer" && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-base font-semibold">Analytics overview</h2>
              {loadingAnalytics && <div className="text-xs text-slate-500">Loading analytics...</div>}
              {analyticsError && <div className="mb-2 rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">{analyticsError}</div>}
              {analytics && (
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border p-3 bg-slate-50">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500">Avg first response</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      {analytics.averageFirstResponseTimeMinutes != null ? `${analytics.averageFirstResponseTimeMinutes.toFixed(1)} min` : "N/A"}
                    </div>
                  </div>

                  <div className="rounded-lg border p-3 bg-slate-50 md:col-span-2">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500">Top keywords</div>
                    {analytics.topKeywords?.length === 0 ? <div className="mt-1 text-xs text-slate-500">No data yet</div> : (
                      <div className="mt-1 flex flex-wrap gap-2 text-xs">
                        {analytics.topKeywords.map((k: any) => (
                          <span key={k.word} className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-[11px] text-indigo-700">
                            {k.word} <span className="ml-1 text-[10px] text-slate-500">×{k.count}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!analytics && !loadingAnalytics && <div className="text-xs text-slate-500">No analytics yet</div>}
            </div>
          )}

          {/* Chat window */}
          {activeChatId && (
            <div className="flex flex-1 flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
                {loadingMessages && <div className="text-xs text-slate-400">Loading messages...</div>}

                {!loadingMessages && messages.length === 0 && <div className="text-xs text-slate-500">No messages yet</div>}

                {messages.map((m) => (
                  <div
                    key={m._id}
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm md:text-base ${m.senderRole === "customer"
                        ? "self-start bg-slate-50 text-slate-900 border border-slate-200"
                        : "self-end bg-slate-800 text-slate-50"
                      }`}
                  >
                    <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500/80">
                      <span>{m.senderRole}</span>
                      {m.sentiment && (
                        <span className={'ml-2 lowercase ' + (m.sentiment === 'positive' ? 'text-emerald-500' : m.sentiment === 'negative' ? 'text-rose-500' : 'text-slate-500')}>
                          ({m.sentiment})
                        </span>
                      )}
                    </div>

                    <div className="whitespace-pre-wrap break-words">{m.text}</div>

                    {m.attachment && (
                      <div className="mt-2">
                        {m.attachment.mimeType?.startsWith("image/") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.attachment.url} alt={m.attachment.filename || "attachment"} className="max-h-40 rounded-md border border-slate-200 bg-white object-contain" />
                        ) : (
                          <a href={m.attachment.url} target="_blank" rel="noreferrer" className="inline-flex items-center text-[11px] underline">
                            {m.attachment.filename || "Download attachment"}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {typingUserId && <div className="text-[11px] italic text-slate-400">Someone is typing...</div>}

                <div ref={messagesEndRef} />
              </div>

              {/* Smart replies */}
              {role !== "customer" && smartReplies.length > 0 && (
                <div className="border-t bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                  <div className="mb-1 font-medium text-slate-700 flex items-center justify-between">
                    <span>Smart replies</span>
                    {loadingSuggestions && <span className="text-[10px] text-slate-400">Loading...</span>}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {smartReplies.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setInput(s)}
                        className="rounded-full border border-slate-300 bg-white px-2 py-1 text-[11px] hover:bg-slate-100"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSend} className="border-t bg-slate-50 p-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <div className="flex flex-1 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById("chat-attachment-input");
                        if (el) (el as HTMLInputElement).click();
                      }}
                      aria-label="Upload attachment"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    >
                      📎
                    </button>

                    <input
                      id="chat-attachment-input"
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={(e) => {
                        const selected = e.target.files?.[0] || null;
                        if (selected && selected.size > 5 * 1024 * 1024) {
                          alert("File is too large. Maximum size is 5MB.");
                          (e.target as HTMLInputElement).value = "";
                          return;
                        }
                        setFile(selected);
                      }}
                    />

                    <input
                      type="text"
                      value={input}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {file && <div className="text-[11px] truncate md:max-w-[200px] text-slate-600">{file.name}</div>}

                  <button
                    type="submit"
                    disabled={sending || !activeChatId || (!input.trim() && !file)}
                    className="mt-1 inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 md:mt-0"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
