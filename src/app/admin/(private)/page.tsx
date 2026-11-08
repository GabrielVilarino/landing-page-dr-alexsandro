"use client";

import Link from "next/link";
import { KeyRound } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/features/auth/hooks/use-session";

export default function AdminHomePage() {
  const { user } = useSession();
  if (!user) return null;

  return (
    <>
      <PageHeader
        title={`Olá, ${user.name.split(" ")[0]}`}
        description="Confira sua conta e os acessos disponíveis."
      />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Minha conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-xs text-muted-foreground">Nome</p>
            <p className="font-medium">{user.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">E-mail</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Papéis</p>
            <div className="flex flex-wrap gap-2">
              {user.roles.map((role) => {
                const name = typeof role === "string" ? role : role.name;
                return (
                  <Badge key={name} variant="secondary">
                    {name}
                  </Badge>
                );
              })}
            </div>
          </div>
          <div className="border-t pt-5">
            <p className="mb-3 text-sm font-medium">Segurança</p>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/admin/trocar-senha" />}
            >
              <KeyRound />
              Trocar senha
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
