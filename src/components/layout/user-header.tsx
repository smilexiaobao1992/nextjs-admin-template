"use client";

import { useEffect, useState } from "react";
import SignOutButton from "@/components/SignOutButton";

interface User {
  email: string;
  name?: string | null;
}

export default function UserHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string>("user");

  useEffect(() => {
    // 只在客户端获取一次用户信息
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setRole(data.role || "user");
        }
      })
      .catch(() => {
        setUser(null);
      });
  }, []);

  if (!user) {
    return (
      <div className="flex justify-end items-center mb-6">
        <div className="text-sm text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex justify-end items-center mb-6 gap-4">
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {user.email}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {role === "admin" ? "管理员" : "普通用户"}
        </p>
      </div>
      <SignOutButton />
    </div>
  );
}
