"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/features/auth/schemas/auth-schema";
import { authService } from "@/features/auth/services/auth-service";
import { getErrorMessage } from "@/lib/api-error";
import { passwordPolicyDescription } from "@/lib/password-policy";

export function ChangePasswordForm() {
  const [apiError, setApiError] = useState<string | null>(null);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current_password: "", new_password: "", confirmation: "" },
  });

  async function onSubmit(values: ChangePasswordInput) {
    setApiError(null);
    try {
      await authService.changePassword(values);
      router.replace("/admin/login?senha=alterada");
      router.refresh();
    } catch (error) {
      setApiError(getErrorMessage(error));
    }
  }

  const fields = [
    ["current_password", "Senha atual", "current-password"],
    ["new_password", "Nova senha", "new-password"],
    ["confirmation", "Confirmar nova senha", "new-password"],
  ] as const;

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      {apiError && (
        <Alert variant="destructive">
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}
      {fields.map(([name, label, autoComplete]) => (
        <div key={name} className="space-y-2">
          <Label htmlFor={name}>{label}</Label>
          <Input
            id={name}
            type="password"
            autoComplete={autoComplete}
            className="h-11"
            aria-invalid={Boolean(errors[name])}
            aria-describedby={errors[name] ? `${name}-error` : undefined}
            {...register(name)}
          />
          {errors[name] && (
            <p id={`${name}-error`} className="text-sm text-destructive">
              {errors[name]?.message}
            </p>
          )}
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        {passwordPolicyDescription} Após a troca, entre novamente.
      </p>
      <Button
        type="submit"
        size="lg"
        className="h-11 w-full"
        disabled={isSubmitting}
      >
        {isSubmitting && <LoaderCircle className="animate-spin" />}{" "}
        {isSubmitting ? "Alterando..." : "Alterar senha"}
      </Button>
    </form>
  );
}
