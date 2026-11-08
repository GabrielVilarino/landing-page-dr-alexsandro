"use client";

import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Pencil, Plus, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/features/auth/hooks/use-session";
import {
  roleSchema,
  type RoleInput,
} from "@/features/roles/schemas/role-schema";
import { roleService } from "@/features/roles/services/role-service";
import type { Permission, Role } from "@/features/roles/types/role";
import { ApiError, getErrorMessage } from "@/lib/api-error";

function RoleForm({
  role,
  permissions,
  onSaved,
  onCancel,
}: {
  role: Role | null;
  permissions: Permission[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);
  const [pendingValues, setPendingValues] = useState<RoleInput | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RoleInput>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name ?? "",
      description: role?.description ?? "",
      permission_ids:
        role?.permissions?.map((permission) => permission.id) ?? [],
    },
  });

  async function save(values: RoleInput) {
    setApiError(null);
    try {
      if (role) {
        await roleService.update(role.id, values);
        await roleService.setPermissions(role.id, values.permission_ids);
      } else {
        await roleService.create(values);
      }
      onSaved();
    } catch (error) {
      setApiError(getErrorMessage(error));
      setPendingValues(null);
    }
  }

  function onSubmit(values: RoleInput) {
    if (role) setPendingValues(values);
    else void save(values);
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex w-full items-start justify-between">
        <div className="flex w-full justify-between gap-3">
          <div>
            <CardTitle>{role ? `Editar ${role.name}` : "Novo papel"}</CardTitle>
            <CardDescription>
              Selecione somente permissões previstas no catálogo do backend.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            aria-label="Fechar formulário"
            className="hover:cursor-pointer"
          >
            <X />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {pendingValues ? (
          <div className="space-y-4">
            <Alert>
              <AlertTitle>Substituir permissões?</AlertTitle>
              <AlertDescription>
                Ao confirmar, toda permissão não selecionada será removida deste
                papel.
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPendingValues(null)}>
                Voltar
              </Button>
              <Button onClick={() => void save(pendingValues)}>
                Confirmar alterações
              </Button>
            </div>
          </div>
        ) : (
          <form
            className="grid gap-4 lg:grid-cols-2"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            {apiError && (
              <Alert variant="destructive" className="lg:col-span-2">
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="role-name">Nome</Label>
              <Input
                id="role-name"
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-description">Descrição</Label>
              <Textarea
                id="role-description"
                aria-invalid={Boolean(errors.description)}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
            <div className="space-y-3 lg:col-span-2">
              <Label>Permissões</Label>
              <Controller
                name="permission_ids"
                control={control}
                render={({ field }) => (
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {permissions.map((permission) => (
                      <label
                        key={permission.id}
                        className="flex cursor-pointer items-start gap-2 rounded-lg border p-3"
                      >
                        <Checkbox
                          className="mt-0.5"
                          checked={field.value.includes(permission.id)}
                          onCheckedChange={(checked) =>
                            field.onChange(
                              checked
                                ? [...field.value, permission.id]
                                : field.value.filter(
                                    (id) => id !== permission.id,
                                  ),
                            )
                          }
                        />
                        <span>
                          <span className="block text-sm font-medium">
                            {permission.description}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              />
            </div>
            <div className="flex justify-end gap-2 lg:col-span-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircle className="animate-spin" />}
                {role ? "Revisar alterações" : "Criar papel"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export function RolesPage() {
  const { can, reload: reloadSession } = useSession();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [editing, setEditing] = useState<Role | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesResult, permissionsResult] = await Promise.all([
        roleService.list(),
        roleService.permissions(),
      ]);
      setRoles(rolesResult);
      setPermissions(permissionsResult);
    } catch (caught) {
      setError(getErrorMessage(caught));
      if (caught instanceof ApiError && caught.status === 403)
        await reloadSession();
    } finally {
      setLoading(false);
    }
  }, [reloadSession]);

  useEffect(() => {
    if (!can("roles.read")) return;
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [can, load]);

  if (!can("roles.read")) return <AccessDenied />;

  return (
    <>
      <PageHeader
        title="Papéis e permissões"
        description="Configure os acessos administrativos a partir do catálogo real."
        actions={
          can("roles.manage") ? (
            <Button onClick={() => setEditing(null)}>
              <Plus />
              Novo papel
            </Button>
          ) : undefined
        }
      />
      {editing !== undefined && (
        <RoleForm
          key={editing?.id ?? "new"}
          role={editing}
          permissions={permissions}
          onCancel={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            void load();
          }}
        />
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
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      ) : roles.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{role.name}</CardTitle>
                    <CardDescription>
                      {role.description || "Sem descrição."}
                    </CardDescription>
                  </div>
                  {can("roles.manage") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditing(role)}
                      aria-label={`Editar ${role.name}`}
                    >
                      <Pencil />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions?.length ? (
                    role.permissions.map((permission) => (
                      <Badge key={permission.id} variant="outline">
                        {permission.description}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Sem permissões atribuídas.
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Nenhum papel encontrado.
          </CardContent>
        </Card>
      )}
    </>
  );
}
