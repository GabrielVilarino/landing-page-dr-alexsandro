"use client";

import { useState } from "react";
import { LoaderCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { authService } from "@/features/auth/services/auth-service";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function logout() {
    setLoading(true);
    try {
      await authService.logout();
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className="w-full"
      disabled={loading}
      onClick={() => void logout()}
    >
      {loading ? <LoaderCircle className="animate-spin" /> : <LogOut />}
      {loading ? "Saindo..." : "Sair e voltar ao login"}
    </Button>
  );
}
