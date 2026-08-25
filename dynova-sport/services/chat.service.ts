import { apiFetch } from "./api";

export async function getCustomerChat() {
  return apiFetch<any>("/chat");
}

export async function sendCustomerChatMessage(message: string) {
  return apiFetch<any>("/chat/messages", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export async function getAdminConversations(status = "all") {
  const qs = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<any>(`/admin/chat${qs}`);
}

export async function getAdminConversation(id: number | string) {
  return apiFetch<any>(`/admin/chat/${id}`);
}

export async function sendAdminChatMessage(id: number | string, message: string) {
  return apiFetch<any>(`/admin/chat/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export async function updateAdminChatStatus(id: number | string, status: "open" | "closed") {
  return apiFetch<any>(`/admin/chat/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
