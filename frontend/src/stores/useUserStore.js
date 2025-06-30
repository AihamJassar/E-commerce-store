import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const useUserStore = create((set, get) => ({
  user: null,
  loading: false,
  checkingAuth: true,
  signup: async ({ name, email, password, confirmPassword }) => {
    try {
      if (password !== confirmPassword)
        return toast.error("Passwords do not match");
      set({ loading: true });
      const res = await axiosInstance.post("/auth/signup", {
        name,
        email,
        password,
      });
      set({ user: res.data.user, loading: false });
      toast.success("Signed up successfully");
    } catch (error) {
      toast.error(error.response.data.message || "An error occurred");
      set({ user: null, loading: false });
    }
  },
  login: async (email, password) => {
    try {
      set({ loading: true });
      const res = await axiosInstance.post("/auth/login", { email, password });
      set({ user: res.data.user, loading: false });
      toast.success("Logged in successfully");
    } catch (error) {
      toast.error(error.response.data.message || "An error occurred");
      set({ user: null, loading: false });
    }
  },
  logout: async () => {
    try {
      set({ loading: true });
      const res = await axiosInstance.post("/auth/logout");
      set({ user: null, loading: false });
      toast.success(res.data.message || "Logged out successfully");
    } catch (error) {
      toast.error(error.response.data.message || "An error occurred");
      set({ user: null, loading: false });
    }
  },
  checkAuth: async () => {
    try {
      set({ checkingAuth: true });
      const res = await axiosInstance.get("/auth/profile");
      set({ user: res.data.user, checkingAuth: false });
    } catch (error) {
      set({ user: null, checkingAuth: false });
      console.error(error.response.data.message || "An error occurred");
    }
  },
  refreshToken: async () => {
    try {
      if (get().checkingAuth) return;

      set({ checkingAuth: true });
      const res = await axiosInstance.post("/auth/refresh-token");
      set({ checkingAuth: false });
      return res.data;
    } catch (error) {
      set({ user: null, checkingAuth: false });
      throw error;
    }
  },
}));

let refreshPromise = null;

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (refreshPromise) {
          await refreshPromise;
          return axiosInstance(originalRequest);
        }

        refreshPromise = useUserStore.getState().refreshToken();
        await refreshPromise;
        refreshPromise = null;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        useUserStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
