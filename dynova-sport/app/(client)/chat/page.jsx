"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { getCustomerChat, sendCustomerChatMessage } from "@/services/chat.service";

export default function CustomerChatPage() {
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await getCustomerChat();
      setConversation(response?.data?.conversation ?? null);
      setMessages(Array.isArray(response?.data?.messages) ? response.data.messages : []);
      setError("");
    } catch (err) {
      setError(err?.message || "Không tải được cuộc trò chuyện.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(() => load(true), 5000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const submit = async (event) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || sending) return;
    try {
      setSending(true);
      await sendCustomerChatMessage(text);
      setMessage("");
      await load(true);
    } catch (err) {
      setError(err?.message || "Không gửi được tin nhắn.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="container-page mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
          <header className="flex items-center justify-between bg-slate-950 px-6 py-5 text-white">
            <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-500"><MessageCircle size={21}/></span><div><h1 className="font-black">Hỗ trợ Dynova</h1><p className="text-xs font-semibold text-slate-400">Tin nhắn được lưu trực tiếp trên hệ thống</p></div></div>
            <span className={`rounded-full px-3 py-1 text-xs font-black ${conversation?.status === "closed" ? "bg-slate-700" : "bg-emerald-500/20 text-emerald-300"}`}>{conversation?.status === "closed" ? "Đã đóng" : "Đang mở"}</span>
          </header>

          <section className="h-[520px] overflow-y-auto bg-slate-50 p-5">
            {loading ? <div className="grid h-full place-items-center"><Loader2 className="animate-spin text-orange-500"/></div> : messages.length === 0 ? <div className="grid h-full place-items-center text-center text-sm font-bold text-slate-400">Chưa có tin nhắn. Bạn có thể gửi câu hỏi cho bộ phận CSKH.</div> : (
              <div className="space-y-3">
                {messages.map((item) => {
                  const mine = item.sender_role === "customer";
                  return <div key={item.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm font-semibold leading-6 ${mine ? "bg-orange-500 text-white" : "border border-slate-200 bg-white text-slate-700"}`}><p>{item.message}</p><p className={`mt-1 text-[10px] ${mine ? "text-orange-100" : "text-slate-400"}`}>{item.created_at ? new Date(item.created_at).toLocaleString("vi-VN") : ""}</p></div></div>;
                })}
                <div ref={bottomRef}/>
              </div>
            )}
          </section>

          <form onSubmit={submit} className="border-t border-slate-200 bg-white p-4">
            {error && <p className="mb-2 text-xs font-bold text-rose-500">{error}</p>}
            <div className="flex gap-3"><input value={message} onChange={(e)=>setMessage(e.target.value)} maxLength={4000} placeholder="Nhập nội dung cần hỗ trợ..." className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-orange-400 focus:bg-white"/><button disabled={sending || !message.trim()} className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500 text-white disabled:opacity-50">{sending ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>}</button></div>
          </form>
        </div>
      </div>
    </main>
  );
}
