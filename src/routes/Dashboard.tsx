import { useAuthStore } from "../store/useAuthStore";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "../hooks/useTranslation";

export const Dashboard = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { t } = useTranslation();

    useEffect(() => {
        if (user) {
            // Redirect based on user role
            if (user.role === "career_counselor") {
                navigate({ to: "/counselor/tests" });
            } else if (user.role === "student") {
                navigate({ to: "/student/tests" });
            } else if (user.role === "admin") {
                navigate({ to: "/schools" });
            }
        }
    }, [user, navigate]);

    return (
        <div style={{ padding: "24px" }}>
            <h1>{t.common.loading}</h1>
        </div>
    );
};
