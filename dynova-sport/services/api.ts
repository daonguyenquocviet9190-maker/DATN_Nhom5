import axios from "axios";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,

    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },

    withCredentials: true, // chuẩn bị cho Sanctum sau này
});

export default api;