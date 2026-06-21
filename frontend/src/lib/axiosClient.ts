// ============================================================
// src/lib/axiosClient.ts
// Central Axios instance with:
//   1. Auth Bearer token injection (request interceptor)
//   2. 401 catch → clear auth state + redirect to /login
//      (no unhandled promise rejections)
// ============================================================

import axios, { type AxiosError } from "axios";
import { useAuthStore } from "@/store/authStore";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  xsrfCookieName: "csrf_token",
  xsrfHeaderName: "X-CSRF-Token",
  headers: {
    "Content-Type": "application/json",
  },
});

// ---- Request Interceptor — inject JWT ----
api.interceptors.request.use(
  (config) => {
    // Read token directly from store state (not hook — interceptors are not components)
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ---- Response Interceptor — handle 401 & CSRF ----
api.interceptors.response.use(
  (response) => {
    const csrfToken = response.headers["x-csrf-token"];
    if (csrfToken) {
      api.defaults.headers.common["X-CSRF-Token"] = csrfToken;
    }
    return response;
  },
  (error: AxiosError) => {
    const csrfToken = error.response?.headers?.["x-csrf-token"];
    if (csrfToken) {
      api.defaults.headers.common["X-CSRF-Token"] = csrfToken;
    }

    if (error.response?.status === 401) {
      // Clear all auth state
      useAuthStore.getState().logout();
      // Redirect to login — only in browser context
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      // Return a never-resolving promise so the calling code
      // does not receive the 401 error and throw an unhandled rejection.
      // The redirect will unmount any pending UI.
      return new Promise(() => {});
    }
    return Promise.reject(error);
  }
);

export default api;
