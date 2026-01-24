"use client";

import { useEffect, useState } from "react";

interface RequireAdminProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function RequireAdmin({ children, fallback }: RequireAdminProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setIsAdmin(data.role === "admin");
        } else {
          setIsAdmin(false);
        }
      })
      .catch(() => {
        setIsAdmin(false);
      });
  }, []);

  if (isAdmin === null) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">验证权限中...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      fallback || (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500">权限不足</p>
            <p className="text-sm text-gray-400 mt-2">只有管理员可以访问此页面</p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
