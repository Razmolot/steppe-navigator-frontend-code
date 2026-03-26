import { useAuthStore } from "../store/useAuthStore";
import { Navigate } from "@tanstack/react-router";
import {Spin} from "antd";
import {LoadingOutlined} from "@ant-design/icons";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { token, loading } = useAuthStore();
    if (!token) return <Navigate to="/login" />;
    if (loading) return <div className={'w-screen h-screen flex justify-center items-center'}><Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} /></div>;
    return <>{children}</>;
};
