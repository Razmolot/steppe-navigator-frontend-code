import React from 'react';
import { Link } from '@tanstack/react-router';

interface Route {
    name: string;
    href?: string; // Если нужна ссылка, иначе просто текст
}

interface BreadcrumbProps {
    routes: Route[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ routes }) => {
    return (
        <nav className="flex items-center mb-2">
            {routes.map((route, idx) => (
                <span className="text-gray-500" key={route.name + idx}>
                    {route.href && route.href !== '#' ? (
                        <Link to={route.href} className="hover:underline text-gray-500">{route.name}</Link>
                    ) : (
                        <span>{route.name}</span>
                    )}
                    {idx < routes.length - 1 && <span className="mx-1">/</span>}
                </span>
            ))}
        </nav>
    );
};

export default Breadcrumb;
