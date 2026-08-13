import { useAuthStore } from "../store/useAuthStore";
import { Navigate, useRouterState } from "@tanstack/react-router";
import {Spin} from "antd";
import {LoadingOutlined} from "@ant-design/icons";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { token, loading, user } = useAuthStore();
    const pathname = useRouterState({ select: (state) => state.location.pathname });

    if (!token) return <Navigate to="/login" />;
    if (loading) return <div className={'w-screen h-screen flex justify-center items-center'}><Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} /></div>;
    if (user?.access_restriction?.restricted && pathname !== "/access-restricted") {
        return <Navigate to="/access-restricted" />;
    }
    return <>{children}</>;
};
