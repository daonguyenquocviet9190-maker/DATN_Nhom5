"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MessageCircle, Send, XCircle } from "lucide-react";
import { getAdminConversation, getAdminConversations, sendAdminChatMessage, updateAdminChatStatus } from "@/services/chat.service";

export default function AdminChatPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadList = useCallback(async () => {
    try {
      const response = await getAdminConversations();
      const rows = response?.data?.conversations || [];
      setConversations(rows);
      if (!selectedId && rows[0]?.id) setSelectedId(rows[0].id);
    } catch (err) { setError(err?.message || "Không tải được danh sách chat."); }
    finally { setLoading(false); }
  }, [selectedId]);

  const loadDetail = useCallback(async (id) => {
    if (!id) return;
    try { const response = await getAdminConversation(id); setDetail(response?.data || null); setError(""); }
    catch (err) { setError(err?.message || "Không tải được nội dung chat."); }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => { if (selectedId) loadDetail(selectedId); }, [selectedId, loadDetail]);
  useEffect(() => { const timer = window.setInterval(() => { loadList(); if (selectedId) loadDetail(selectedId); }, 5000); return () => clearInterval(timer); }, [loadList, loadDetail, selectedId]);

  const submit = async (event) => {
    event.preventDefault();
    if (!selectedId || !message.trim()) return;
    try { setSending(true); await sendAdminChatMessage(selectedId, message.trim()); setMessage(""); await loadDetail(selectedId); await loadList(); }
    catch (err) { setError(err?.message || "Không gửi được phản hồi."); }
    finally { setSending(false); }
  };

  const closeConversation = async () => {
    if (!selectedId) return;
    await updateAdminChatStatus(selectedId, detail?.conversation?.status === "closed" ? "open" : "closed");
    await loadDetail(selectedId); await loadList();
  };

  return <div className="space-y-5">
    <section className="rounded-[30px] border border-white/10 bg-white/[0.06] p-6"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500 text-white"><MessageCircle/></span><div><p className="text-xs font-black uppercase tracking-[.2em] text-orange-300">Customer service</p><h1 className="text-2xl font-black text-white">Admin Chat</h1></div></div></section>
    {error && <div className="rounded-2xl bg-rose-500/10 p-4 text-sm font-bold text-rose-200">{error}</div>}
    <section className="grid min-h-[620px] overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.05] lg:grid-cols-[330px_1fr]">
      <aside className="border-b border-white/10 lg:border-b-0 lg:border-r"><div className="border-b border-white/10 p-4 text-sm font-black text-white">Cuộc trò chuyện ({conversations.length})</div><div className="max-h-[570px] overflow-y-auto p-2">{loading ? <Loader2 className="mx-auto mt-8 animate-spin text-orange-300"/> : conversations.map((c)=><button key={c.id} onClick={()=>setSelectedId(c.id)} className={`mb-2 w-full rounded-2xl p-4 text-left ${String(selectedId)===String(c.id)?"bg-orange-500 text-white":"bg-white/[0.05] text-slate-300 hover:bg-white/[0.09]"}`}><div className="flex justify-between gap-2"><b className="truncate">{c.customer_name || c.customer_email || `Khách #${c.user_id}`}</b>{Number(c.unread_count)>0 && <span className="rounded-full bg-white/20 px-2 text-xs">{c.unread_count}</span>}</div><p className="mt-1 truncate text-xs opacity-70">{c.last_message?.message || "Chưa có tin nhắn"}</p></button>)}</div></aside>
      <div className="flex min-h-[620px] flex-col">{!detail ? <div className="grid flex-1 place-items-center text-sm font-bold text-slate-500">Chọn một cuộc trò chuyện</div> : <><header className="flex items-center justify-between border-b border-white/10 p-4"><div><b className="text-white">{detail.conversation?.customer_name || detail.conversation?.customer_email}</b><p className="text-xs text-slate-400">{detail.conversation?.status === "closed" ? "Đã đóng" : "Đang mở"}</p></div><button onClick={closeConversation} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-slate-300 hover:bg-white/10"><XCircle size={15}/>{detail.conversation?.status === "closed" ? "Mở lại" : "Đóng chat"}</button></header><div className="flex-1 space-y-3 overflow-y-auto p-5">{(detail.messages || []).map((m)=><div key={m.id} className={`flex ${m.sender_role === "admin" ? "justify-end":"justify-start"}`}><div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm font-semibold ${m.sender_role === "admin" ? "bg-orange-500 text-white":"bg-white/10 text-slate-200"}`}><p>{m.message}</p><p className="mt-1 text-[10px] opacity-60">{m.created_at ? new Date(m.created_at).toLocaleString("vi-VN") : ""}</p></div></div>)}</div><form onSubmit={submit} className="flex gap-3 border-t border-white/10 p-4"><input value={message} onChange={(e)=>setMessage(e.target.value)} className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-orange-400" placeholder="Nhập phản hồi..."/><button disabled={sending || !message.trim()} className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500 text-white disabled:opacity-50">{sending?<Loader2 className="animate-spin" size={17}/>:<Send size={17}/>}</button></form></>}</div>
    </section>
  </div>;
}
