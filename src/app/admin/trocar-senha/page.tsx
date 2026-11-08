import Image from "next/image";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { LogoutButton } from "@/features/auth/components/logout-button";

export default function ChangePasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-5">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Image
            src="/admin-logo.png"
            alt="Dr. Alexsandro Araújo"
            width={230}
            height={80}
            className="h-auto w-55"
            priority
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Trocar senha</CardTitle>
            <CardDescription>
              Por segurança, defina uma nova senha antes de continuar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ChangePasswordForm />
            <LogoutButton />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
