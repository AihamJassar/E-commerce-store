import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const useUserStore = create((set) => ({
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
}));
