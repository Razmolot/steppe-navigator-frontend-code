import { create } from "zustand";
import axiosClient from "../api/axiosClient";

interface User {
    id: number;
    name: string;
    email: string;
    phone: string | null | undefined;
    role: "admin" | "career_counselor" | "student";
}

interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    fetchUser: () => Promise<void>;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: localStorage.getItem("token"),
    loading: false,

    async login(email, password) {
        set({ loading: true });
        try {
            const { data } = await axiosClient.post("/login", { email, password });
            localStorage.setItem("token", data.token);
            set({ token: data.token });
            await useAuthStore.getState().fetchUser();
            set({ loading: false });
            return true;
        } catch {
            set({ loading: false });
            return false;
        }
    },

    async fetchUser() {
        set({ loading: true });
        try {
            const { data } = await axiosClient.get("/user/profile");
            set({ user: data });
            set({ loading: false });
        } catch {
            set({ user: null, token: null });
            set({ loading: false });
            localStorage.removeItem("token");
        }
    },

    logout() {
        localStorage.removeItem("token");
        set({ user: null, token: null });
    },
}));