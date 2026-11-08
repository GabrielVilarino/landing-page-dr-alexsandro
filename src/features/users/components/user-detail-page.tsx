"use client";

import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";

import { AccessDenied } from "@/components/admin/access-denied";
import { PageHeader } from "@/components/admin/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/features/auth/hooks/use-session";
import { roleService } from "@/features/roles/services/role-service";
import type { Role } from "@/features/roles/types/role";
import {
  resetPasswordSchema,
  updateUserSchema,
  userRolesSchema,
  type ResetPasswordInput,
  type UpdateUserInput,
  type UserRolesInput,
} from "@/features/users/schemas/user-schema";
import { userService } from "@/features/users/services/user-service";
import { passwordPolicyDescription } from "@/lib/password-policy";
import type { User } from "@/features/users/types/user";
import { ApiError, getErrorMessage } from "@/lib/api-error";

export function UserDetailPage({ id }: { id: number }) {
  const { can, reload: reloadSession } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [showRolesEditor, setShowRolesEditor] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmActive, setConfirmActive] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(
    null,
  );

  const editForm = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: { name: "", email: "" },
  });
  const rolesForm = useForm<UserRolesInput>({
    resolver: zodResolver(userRolesSchema),
    defaultValues: { role_ids: [] },
  });
  const passwordForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { temporary_password: "", confirmation: "" },
  });

  const loadRoles = useCallback(async () => {
    if (!can("users.assign_roles") || !can("roles.read")) return;
    setRolesLoading(true);
    setRolesError(null);
    try {
      setRoles(await roleService.list());
    } catch (error) {
      setRoles([]);
      setRolesError(getErrorMessage(error));
    } finally {
      setRolesLoading(false);
    }
  }, [can]);

  const load = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const foundUser = await userService.get(id);
      setUser(foundUser);
      editForm.reset({ name: foundUser.name, email: foundUser.email });
      rolesForm.reset({
        role_ids: foundUser.roles
          .map((role) => role.id)
          .filter((roleId): roleId is number => typeof roleId === "number"),
      });
    } catch (error) {
      setApiError(getErrorMessage(error));
      if (error instanceof ApiError && error.status === 403)
        await reloadSession();
    } finally {
      setLoading(false);
    }
  }, [editForm, id, reloadSession, rolesForm]);

  useEffect(() => {
    if (!can("users.read")) return;
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [can, load]);

  async function run(action: () => Promise<unknown>, success: string) {
    setApiError(null);
    setMessage(null);
    try {
      await action();
      setMessage(success);
      await load();
    } catch (error) {
      setApiError(getErrorMessage(error));
      if (error instanceof ApiError && error.status === 403)
        await reloadSession();
    }
  }

  if (!can("users.read")) return <AccessDenied />;
  if (loading && !user)
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );

  return (
    <>
      <Button
        variant="ghost"
        className="mb-4"
        nativeButton={false}
        render={<Link href="/admin/colaboradores" />}
      >
        <ArrowLeft />
        Voltar
      </Button>
      <PageHeader
        title={user?.name ?? "Colaborador"}
        description="Edite os dados do colaborador."
      />
      {apiError && (
        <Alert variant="destructive" className="mb-5">
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}
      {message && (
        <Alert className="mb-5">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      {!user ? (
        <Alert>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>Colaborador indisponível.</span>
            <Button variant="outline" onClick={() => void load()}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Dados da conta</CardTitle>
              <CardDescription>Nome e e-mail do colaborador.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={editForm.handleSubmit((values) =>
                  run(
                    () => userService.update(id, values),
                    "Dados atualizados.",
                  ),
                )}
                noValidate
              >
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome completo</Label>
                  <Input
                    id="edit-name"
                    disabled={!can("users.update")}
                    aria-invalid={Boolean(editForm.formState.errors.name)}
                    {...editForm.register("name")}
                  />
                  {editForm.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {editForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">E-mail</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    disabled={!can("users.update")}
                    aria-invalid={Boolean(editForm.formState.errors.email)}
                    {...editForm.register("email")}
                  />
                  {editForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {editForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={user.active ? "default" : "outline"}>
                    {user.active ? "Ativo" : "Inativo"}
                  </Badge>
                  {user.must_change_password && (
                    <Badge variant="secondary">Troca de senha pendente</Badge>
                  )}
                </div>
                {can("users.update") && (
                  <Button
                    type="submit"
                    disabled={editForm.formState.isSubmitting}
                  >
                    {editForm.formState.isSubmitting && (
                      <LoaderCircle className="animate-spin" />
                    )}
                    Salvar dados
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Papéis</CardTitle>
              <CardDescription>
                Os acessos efetivos resultam da combinação dos papéis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {user.roles.length ? (
                  user.roles.map((role) => (
                    <Badge key={role.id ?? role.name} variant="secondary">
                      {role.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Nenhum papel atribuído.
                  </span>
                )}
              </div>
              {can("users.assign_roles") && !can("roles.read") && (
                <Alert>
                  <AlertDescription>
                    A edição de papéis também requer a permissão roles.read.
                  </AlertDescription>
                </Alert>
              )}
              {can("users.assign_roles") &&
                can("roles.read") &&
                !showRolesEditor && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRolesEditor(true);
                      void loadRoles();
                    }}
                  >
                    Editar papéis
                  </Button>
                )}
              {showRolesEditor &&
                can("users.assign_roles") &&
                can("roles.read") &&
                (rolesLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : rolesError ? (
                  <Alert variant="destructive">
                    <AlertDescription className="space-y-3">
                      <p>Não foi possível carregar os papéis: {rolesError}</p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => void loadRoles()}
                        >
                          Tentar novamente
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setShowRolesEditor(false)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <form
                    className="space-y-4"
                    onSubmit={rolesForm.handleSubmit((values) =>
                      run(
                        () => userService.setRoles(id, values),
                        "Papéis atualizados.",
                      ),
                    )}
                    noValidate
                  >
                    <Controller
                      name="role_ids"
                      control={rolesForm.control}
                      render={({ field }) => (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {roles.map((role) => (
                            <label
                              key={role.id}
                              className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm"
                            >
                              <Checkbox
                                checked={field.value.includes(role.id)}
                                onCheckedChange={(checked) =>
                                  field.onChange(
                                    checked
                                      ? [...field.value, role.id]
                                      : field.value.filter(
                                          (roleId) => roleId !== role.id,
                                        ),
                                  )
                                }
                              />
                              {role.name}
                            </label>
                          ))}
                        </div>
                      )}
                    />
                    {rolesForm.formState.errors.role_ids && (
                      <p className="text-sm text-destructive">
                        {rolesForm.formState.errors.role_ids.message}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={
                          rolesForm.formState.isSubmitting || roles.length === 0
                        }
                      >
                        Salvar papéis
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowRolesEditor(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                ))}
            </CardContent>
          </Card>
          {can("users.set_active") && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {user.active ? "Desativar conta" : "Reativar conta"}
                </CardTitle>
                <CardDescription>
                  {user.active
                    ? "O colaborador perderá o acesso ao sistema."
                    : "O colaborador poderá voltar a entrar no sistema."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {confirmActive ? (
                  <div className="space-y-4">
                    <Alert>
                      <AlertTitle>Confirme a alteração</AlertTitle>
                      <AlertDescription>
                        Esta ação altera imediatamente o acesso do colaborador.
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setConfirmActive(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant={user.active ? "destructive" : "default"}
                        onClick={() => {
                          setConfirmActive(false);
                          void run(
                            () => userService.setActive(id, !user.active),
                            user.active
                              ? "Conta desativada."
                              : "Conta reativada.",
                          );
                        }}
                      >
                        Confirmar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant={user.active ? "destructive" : "default"}
                    onClick={() => setConfirmActive(true)}
                  >
                    {user.active ? "Desativar" : "Reativar"}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
          {can("users.reset_password") && (
            <Card>
              <CardHeader>
                <CardTitle>Redefinir senha</CardTitle>
                <CardDescription>{passwordPolicyDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                {temporaryPassword ? (
                  <Alert>
                    <AlertTitle>Senha redefinida</AlertTitle>
                    <AlertDescription className="space-y-3">
                      <p>
                        Comunique esta senha agora. Ela não ficará armazenada.
                      </p>
                      <code className="block rounded bg-secondary p-3 text-foreground break-all">
                        {temporaryPassword}
                      </code>
                      <Button onClick={() => setTemporaryPassword(null)}>
                        Ocultar senha
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <form
                    className="space-y-4"
                    onSubmit={passwordForm.handleSubmit(async (values) => {
                      setApiError(null);
                      try {
                        await userService.resetPassword(id, values);
                        setTemporaryPassword(values.temporary_password);
                        passwordForm.reset();
                        await load();
                      } catch (error) {
                        setApiError(getErrorMessage(error));
                      }
                    })}
                    noValidate
                  >
                    <div className="space-y-2">
                      <Label htmlFor="temporary-password">
                        Senha temporária
                      </Label>
                      <Input
                        id="temporary-password"
                        type="password"
                        autoComplete="new-password"
                        aria-invalid={Boolean(
                          passwordForm.formState.errors.temporary_password,
                        )}
                        {...passwordForm.register("temporary_password")}
                      />
                      {passwordForm.formState.errors.temporary_password && (
                        <p className="text-sm text-destructive">
                          {
                            passwordForm.formState.errors.temporary_password
                              .message
                          }
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="temporary-confirmation">
                        Confirmar senha
                      </Label>
                      <Input
                        id="temporary-confirmation"
                        type="password"
                        autoComplete="new-password"
                        aria-invalid={Boolean(
                          passwordForm.formState.errors.confirmation,
                        )}
                        {...passwordForm.register("confirmation")}
                      />
                      {passwordForm.formState.errors.confirmation && (
                        <p className="text-sm text-destructive">
                          {passwordForm.formState.errors.confirmation.message}
                        </p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      disabled={passwordForm.formState.isSubmitting}
                    >
                      Redefinir senha
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
