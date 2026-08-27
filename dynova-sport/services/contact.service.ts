import { apiFetch } from "./api";

export async function sendContact(payload: {
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
}) {
  return apiFetch<any>("/contact", {
    method: "POST",
    auth: false,
    body: JSON.stringify(payload),
  });
}
