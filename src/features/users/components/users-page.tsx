"use client";

import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight, Eye, LoaderCircle, Plus, X } from "lucide-react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";

import { AccessDenied } from "@/components/admin/access-denied";
import { PageHeader } from "@/components/admin/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "@/features/auth/hooks/use-session";
import { roleService } from "@/features/roles/services/role-service";
import type { Role } from "@/features/roles/types/role";
import {
  createUserSchema,
  type CreateUserInput,
} from "@/features/users/schemas/user-schema";
import { userService } from "@/features/users/services/user-service";
import type { UserList } from "@/features/users/types/user";
import { ApiError, getErrorMessage } from "@/lib/api-error";
import { passwordPolicyDescription } from "@/lib/password-policy";

const LIMIT = 20;

function CreateUserForm({
  roles,
  onCreated,
  onCancel,
}: {
  roles: Role[];
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(
    null,
  );
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmation: "",
      role_ids: [],
    },
  });

  async function onSubmit(values: CreateUserInput) {
    setApiError(null);
    try {
      await userService.create(values);
      setTemporaryPassword(values.password);
      reset();
      onCreated();
    } catch (error) {
      setApiError(getErrorMessage(error));
    }
  }

  if (temporaryPassword) {
    return (
      <Alert>
        <AlertTitle>Colaborador criado</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>
            Comunique a senha temporária agora. Ela não será exibida novamente.
          </p>
          <code className="block rounded-md bg-secondary p-3 text-foreground break-all">
            {temporaryPassword}
          </code>
          <Button
            onClick={() => {
              setTemporaryPassword(null);
              onCancel();
            }}
          >
            Concluir
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="flex w-full items-center justify-between">
        <div className="flex w-full items-center justify-between gap-1">
          <CardTitle>Novo colaborador</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            aria-label="Fechar formulário"
            className={"hover:cursor-pointer"}
          >
            <X />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          {apiError && (
            <Alert variant="destructive" className="sm:col-span-2">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="create-name">Nome completo</Label>
            <Input
              id="create-name"
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="create-email">E-mail</Label>
            <Input
              id="create-email"
              type="email"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-password">Senha temporária</Label>
            <Input
              id="create-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {passwordPolicyDescription}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-confirmation">Confirmar senha</Label>
            <Input
              id="create-confirmation"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmation)}
              {...register("confirmation")}
            />
            {errors.confirmation && (
              <p className="text-sm text-destructive">
                {errors.confirmation.message}
              </p>
            )}
          </div>
          <div className="space-y-3 sm:col-span-2">
            <Label>Papéis</Label>
            <Controller
              name="role_ids"
              control={control}
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
                              : field.value.filter((id) => id !== role.id),
                          )
                        }
                      />
                      {role.name}
                    </label>
                  ))}
                </div>
              )}
            />
            {errors.role_ids && (
              <p className="text-sm text-destructive">
                {errors.role_ids.message}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <LoaderCircle className="animate-spin" />}Criar
              colaborador
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function UsersPage() {
  const { can, reload: reloadSession } = useSession();
  const [data, setData] = useState<UserList | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [offset, setOffset] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);

  const loadRoles = useCallback(async () => {
    if (!can("roles.read")) return;
    setRolesLoading(true);
    setRolesError(null);
    try {
      setRoles(await roleService.list());
    } catch (caught) {
      setRoles([]);
      setRolesError(getErrorMessage(caught));
    } finally {
      setRolesLoaded(true);
      setRolesLoading(false);
    }
  }, [can]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const users = await userService.list(LIMIT, offset);
      setData(users);
    } catch (caught) {
      setError(getErrorMessage(caught));
      if (caught instanceof ApiError && caught.status === 403)
        await reloadSession();
    } finally {
      setLoading(false);
    }
  }, [offset, reloadSession]);

  useEffect(() => {
    if (!can("users.read")) return;
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [can, load]);

  if (!can("users.read")) return <AccessDenied />;

  function openCreate() {
    if (!can("roles.read")) return;
    setShowCreate(true);
    if (!rolesLoaded) void loadRoles();
  }

  return (
    <>
      <PageHeader
        title="Colaboradores"
        description="Gerencie contas, papéis e acessos da equipe."
        actions={
          can("users.create") ? (
            <Button
              disabled={!can("roles.read")}
              title={
                !can("roles.read")
                  ? "A criação requer também a permissão roles.read."
                  : undefined
              }
              onClick={openCreate}
            >
              <Plus />
              Novo colaborador
            </Button>
          ) : undefined
        }
      />
      {showCreate && (
        <div className="mb-6">
          {rolesLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : rolesError ? (
            <Alert variant="destructive">
              <AlertDescription className="space-y-3">
                <p>Não foi possível carregar os papéis: {rolesError}</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => void loadRoles()}>
                    Tentar novamente
                  </Button>
                  <Button variant="ghost" onClick={() => setShowCreate(false)}>
                    Cancelar
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : rolesLoaded && roles.length === 0 ? (
            <Alert>
              <AlertDescription className="space-y-3">
                <p>
                  Não há papéis disponíveis; a criação de colaboradores está
                  desabilitada.
                </p>
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  Fechar
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <CreateUserForm
              roles={roles}
              onCreated={() => void load()}
              onCancel={() => setShowCreate(false)}
            />
          )}
        </div>
      )}
      {error && (
        <Alert variant="destructive" className="mb-5">
          <AlertDescription className="flex items-center justify-between gap-4">
            {error}
            <Button variant="outline" onClick={() => void load()}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : data?.items.length ? (
            <Table>
              <TableHeader className="bg-secondary/50">
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Papéis</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Senha</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles?.map((role) => (
                          <Badge key={role.id ?? role.name} variant="secondary">
                            {role.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.active ? "default" : "outline"}>
                        {user.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.must_change_password ? (
                        <Badge variant="outline">Troca pendente</Badge>
                      ) : (
                        "Definida"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        nativeButton={false}
                        render={<Link href={`/admin/pacientes/${user.id}`} />}
                        aria-label={`Ver cadastro de ${user.name}`}
                        title="Ver cadastro"
                      >
                        <Eye />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Nenhum colaborador encontrado.
            </div>
          )}
        </CardContent>
      </Card>
      {data && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {data.total
              ? `${offset + 1}–${Math.min(offset + LIMIT, data.total)} de ${data.total}`
              : "Sem resultados"}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={offset === 0 || loading}
              onClick={() => setOffset(Math.max(0, offset - LIMIT))}
              aria-label="Página anterior"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={offset + LIMIT >= data.total || loading}
              onClick={() => setOffset(offset + LIMIT)}
              aria-label="Próxima página"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
