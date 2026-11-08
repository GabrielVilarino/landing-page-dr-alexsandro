"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Stethoscope,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionProvider, useSession } from "@/features/auth/hooks/use-session";
import { cn } from "@/lib/utils";

const links = [
  {
    href: "/admin/pacientes",
    label: "Pacientes",
    icon: Stethoscope,
    permission: "patients.read",
  },
  {
    href: "/admin/colaboradores",
    label: "Colaboradores",
    icon: Users,
    permission: "users.read",
  },
  {
    href: "/admin/papeis",
    label: "Papéis e permissões",
    icon: ShieldCheck,
    permission: "roles.read",
  },
];

function ShellContent({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, loading, error, can, reload, logout } = useSession();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="w-full max-w-md space-y-3 px-6">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <Alert className="max-w-md">
          <AlertDescription className="space-y-4">
            <p>{error ?? "Sessão indisponível."}</p>
            <Button onClick={() => void reload()}>Tentar novamente</Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const roleNames = user.roles.map((role) =>
    typeof role === "string" ? role : role.name,
  );
  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  const sidebar = (collapsed: boolean) => (
    <>
      <div
        className={cn(
          "flex h-24 items-center justify-center border-b px-3",
          collapsed && "px-2",
        )}
      >
        <Image
          src="/admin-logo.png"
          alt="Dr. Alexsandro Araújo"
          width={210}
          height={72}
          className={cn(
            "h-auto max-h-16 w-auto transition-all",
            collapsed && "max-h-10",
          )}
          priority
        />
      </div>
      <nav
        className="flex-1 space-y-1 overflow-y-auto p-3"
        aria-label="Navegação administrativa"
      >
        {links
          .filter((link) => !link.permission || can(link.permission))
          .map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground",
                  collapsed && "justify-center px-2",
                  active &&
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                )}
                aria-label={collapsed ? link.label : undefined}
                title={collapsed ? link.label : undefined}
              >
                <link.icon className="size-4" />
                <span className={cn(collapsed && "sr-only")}>{link.label}</span>
              </Link>
            );
          })}
      </nav>
      <div className="border-t p-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex w-full items-center gap-3 rounded-lg p-2 text-left outline-none transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring",
              collapsed && "justify-center",
            )}
            aria-label="Abrir menu da conta"
            title={collapsed ? "Menu da conta" : undefined}
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {initials}
            </div>
            <div className={cn("min-w-0 flex-1", collapsed && "sr-only")}>
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {roleNames.join(", ") || "Sem papel"}
              </p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-52">
            <DropdownMenuItem
              render={<Link href="/admin" />}
              onClick={() => setMobileOpen(false)}
            >
              Minha conta
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => void logout()}
            >
              <LogOut />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r bg-card transition-[width] duration-200 lg:flex",
          desktopCollapsed ? "w-16" : "w-64",
        )}
      >
        {sidebar(desktopCollapsed)}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 bg-black/35"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-[min(18rem,88vw)] flex-col bg-card shadow-xl">
            {sidebar(false)}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 hover:cursor-pointer"
              onClick={() => setMobileOpen(false)}
              aria-label="Fechar menu"
            >
              <X />
            </Button>
          </aside>
        </div>
      )}
      <div
        className={cn(
          "transition-[padding] duration-200",
          desktopCollapsed ? "lg:pl-16" : "lg:pl-64",
        )}
      >
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-card/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:inline-flex"
              onClick={() => setDesktopCollapsed((collapsed) => !collapsed)}
              aria-label={
                desktopCollapsed
                  ? "Expandir menu lateral"
                  : "Recolher menu lateral"
              }
            >
              {desktopCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu />
            </Button>
          </div>
          <p className="ml-auto text-sm text-muted-foreground">{user.email}</p>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ShellContent>{children}</ShellContent>
    </SessionProvider>
  );
}
