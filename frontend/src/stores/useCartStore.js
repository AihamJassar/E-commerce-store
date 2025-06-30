import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";

export const useCartStore = create((set, get) => ({
  cart: [],
  coupon: null,
  total: 0,
  subtotal: 0,
  isCouponApplied: false,

  getMyCoupon: async () => {
    try {
      const res = await axiosInstance.get(`/coupons`);
      set({ coupon: res.data.coupon });
    } catch (error) {
      console.error(error.response.data.message);
    }
  },
  applyCoupon: async (code) => {
    try {
      const res = await axiosInstance.get("/coupons", { code });
      set({ coupon: res.data.coupon, isCouponApplied: true });
      get().calculateTotals();
      toast.success("Coupon applied successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to apply coupon");
    }
  },
  removeCoupon: async () => {
    set({ coupon: null, isCouponApplied: false });
    get().calculateTotals();
    toast.success("Coupon removed");
  },
  getCartItems: async () => {
    try {
      const res = await axiosInstance.get("/carts");
      set({ cart: res.data.cartItems });
      get().calculateTotals();
    } catch (error) {
      set({ cart: [] });
      toast.error(error.response.data.message || "Failed to fetch cart");
    }
  },
  clearCart: async () => {
    set({ cart: [], coupon: null, total: 0, subtotal: 0 });
  },
  addToCart: async (product) => {
    try {
      await axiosInstance.post("/carts", { productId: product._id });
      toast.success("Product added to cart");

      set((prevState) => {
        const existingItem = prevState.cart.find(
          (item) => item._id === product._id
        );
        const newCart = existingItem
          ? prevState.cart.map((item) =>
              item._id === product._id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          : [...prevState.cart, { ...product, quantity: 1 }];
        return { cart: newCart };
      });
      get().calculateTotals();
    } catch (error) {
      toast.error(error.response.data.message || "An error occurred");
    }
  },
  removeFromCart: async (productId) => {
    try {
      await axiosInstance.delete(`/carts/${productId}`);
      set((prevState) => ({
        cart: prevState.cart.filter((item) => item._id !== productId),
      }));
      get().calculateTotals();
    } catch (error) {
      toast.error(error.response.data.message || "Failed to delete item");
    }
  },
  updateQuantity: async (productId, quantity) => {
    try {
      if (quantity === 0) {
        get().removeFromCart(productId);
        return;
      }
      await axiosInstance.put(`/carts/${productId}`, { quantity });
      set((prevState) => ({
        cart: prevState.cart.map((item) =>
          item._id === productId ? { ...item, quantity } : item
        ),
      }));
      get().calculateTotals();
    } catch (error) {
      toast.error(error.response.data.message || "Failed to update quantity");
    }
  },
  calculateTotals: async () => {
    try {
      const { cart, coupon } = get();
      const subtotal = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      let total = subtotal;

      if (coupon) {
        const discount = subtotal * (coupon.discountPercentage / 100);
        total = subtotal - discount;
      }
      set({ subtotal, total });
    } catch (error) {
      toast.error(error.response.data.message || "Failed to calculate total");
    }
  },
}));
