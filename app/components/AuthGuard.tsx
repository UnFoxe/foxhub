"use client";
import { useAuth } from "@/src/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) return <div>Загрузка...</div>;
  return <>{children}</>;
}