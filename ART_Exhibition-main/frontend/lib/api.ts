import axios from "axios";

const defaultBaseURL = "http://localhost:5000/api";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || defaultBaseURL,
});

API.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      const token =
        window.localStorage.getItem("auth_token") ||
        window.localStorage.getItem("curator_jwt") ||
        "";

      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore
    }
  }
  return config;
});

export default API;

