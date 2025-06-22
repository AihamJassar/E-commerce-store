import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useProductStore = create((set) => ({
  products: [],
  loading: false,
  setProducts: (products) => set({ products }),
  createProduct: async (newProduct) => {
    try {
      set({ loading: true });
      const res = await axiosInstance.post("/products", newProduct);
      set((prevProducts) => ({
        products: [...prevProducts.products, res.data],
        loading: false,
      }));
      toast.success("Product created successfully");
    } catch (error) {
      toast.error(error.response.data.message || "Error in creating a product");
      set({ loading: false });
    }
  },
  fetchAllProducts: async () => {
    try {
      set({ loading: true });
      const res = await axiosInstance.get("/products");
      set({ products: res.data.products, loading: false });
    } catch (error) {
      set({ loading: false });
      toast.error(error.response.data.message || "Failed to fetch products");
    }
  },
  fetchProductsByCategory: async (category) => {
    try {
      set({ loading: true });
      const res = await axiosInstance.get(`/products/category/${category}`);
      set({ products: res.data.products, loading: false });
    } catch (error) {
      set({ loading: false });
      toast.error(error.response.data.message || "Failed to fetch products");
    }
  },
  deleteProduct: async (productId) => {
    try {
      set({ loading: true });
      const res = await axiosInstance.delete(`/products/${productId}`);
      set((prevProducts) => ({
        products: prevProducts.products.filter(
          (product) => product._id !== productId
        ),
        loading: false,
      }));
      toast.success(res.data.message);
    } catch (error) {
      set({ loading: false });
      toast.error(error.response.data.message || "Failed to delete product");
    }
  },
  toggleFeaturedProduct: async (productId) => {
    try {
      set({ loading: true });
      const res = await axiosInstance.patch(`/products/featured/${productId}`);
      set((prevProducts) => ({
        products: prevProducts.products.map((product) =>
          product._id === productId
            ? { ...product, isFeatured: res.data.product.isFeatured }
            : product
        ),
        loading: false,
      }));
    } catch (error) {
      set({ loading: false });
      toast.error(error.response.data.message || "Failed to update product");
    }
  },
  fetchFeaturedProducts: async () => {
    try {
      set({ loading: true });
      const res = await axiosInstance.get("/products/featured");
      set({ products: res.data.products, loading: false });
    } catch (error) {
      set({ loading: false });
      toast.error(error.response.data.message || "Failed to fetch products");
    }
  },
}));
