import axios, { type AxiosError } from "axios";
import {useAuthStore} from "../store/useAuthStore.ts";

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const axiosClient = axios.create({
    baseURL: `${apiUrl}/api`,
    headers: {
        "Content-Type": "application/json",
    },
});

axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

axiosClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
