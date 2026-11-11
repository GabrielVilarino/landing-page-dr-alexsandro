"use client";

import { useState } from "react";
import { LoaderCircle, RefreshCcw, Unplug } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCalendarIntegration } from "@/features/calendar-integrations/hooks/use-calendar-integration";
import type {
  CalendarIntegrationStatus,
  GoogleCalendarOption,
} from "@/features/calendar-integrations/types/calendar-integration";

const statusLabels: Record<CalendarIntegrationStatus, string> = {
  PENDENTE: "Seleção pendente",
  ATIVA: "Ativa",
  ERRO: "Com erro",
  DESCONECTADA: "Desconectada",
};

function formatLastSync(value?: string) {
  if (!value) return "Ainda não informada";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Ainda não informada";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function CalendarPicker({
  calendars,
  value,
  onChange,
  onSave,
  loading,
  saving,
  submitLabel = "Ativar sincronização",
}: {
  calendars: GoogleCalendarOption[];
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  loading: boolean;
  saving: boolean;
  submitLabel?: string;
}) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="space-y-1.5">
        <Label htmlFor="google-calendar">Calendário de destino</Label>
        <Select
          value={value || null}
          onValueChange={(next) => onChange(String(next ?? ""))}
          disabled={loading || saving}
        >
          <SelectTrigger id="google-calendar" className="w-full max-w-md">
            <SelectValue>
              {(selectedValue) =>
                selectedValue
                  ? calendars.find((item) => item.id === selectedValue)
                      ?.summary || "Calendário selecionado"
                  : "Selecione um calendário"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {calendars.map((calendar) => (
              <SelectItem key={calendar.id} value={calendar.id}>
                {calendar.summary}
                {calendar.primary ? " (principal)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {loading && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="animate-spin" /> Carregando calendários...
        </p>
      )}
      {!loading && calendars.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum calendário com permissão de escrita foi encontrado.
        </p>
      )}
      <Button
        type="button"
        disabled={!value || loading || saving}
        onClick={onSave}
      >
        {saving && <LoaderCircle className="animate-spin" />}
        {submitLabel}
      </Button>
    </div>
  );
}

export function CalendarIntegrationPanel({
  doctorId,
  canManage,
}: {
  doctorId: number | null;
  canManage: boolean;
}) {
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [changingCalendar, setChangingCalendar] = useState(false);
  const integration = useCalendarIntegration({
    doctorId,
    canRead: true,
    canManage,
  });
  const disconnected =
    integration.loadStatus === "success" &&
    (!integration.connection ||
      integration.connection.status === "DESCONECTADA");
  const busy = integration.mutation !== null;

  async function beginCalendarChange() {
    if (await integration.loadCalendars()) setChangingCalendar(true);
  }

  async function saveCalendar() {
    if (await integration.selectCalendar()) setChangingCalendar(false);
  }

  async function confirmDisconnect() {
    if (await integration.disconnect()) {
      setDisconnectOpen(false);
      setChangingCalendar(false);
    }
  }

  if (!doctorId) {
    return (
      <Alert>
        <AlertDescription>
          Selecione um médico para consultar a integração.
        </AlertDescription>
      </Alert>
    );
  }

  if (
    (integration.loadStatus === "idle" ||
      integration.loadStatus === "loading") &&
    !integration.connection
  ) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-8 w-36" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {integration.error && (
        <Alert variant="destructive" role="alert" className="mb-4">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{integration.error}</span>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => void integration.refresh()}
            >
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Sincronização com Google Calendar</CardTitle>
            {integration.connection && (
              <Badge
                variant={
                  integration.connection.status === "ERRO"
                    ? "destructive"
                    : integration.connection.status === "ATIVA"
                      ? "default"
                      : "outline"
                }
              >
                {statusLabels[integration.connection.status]}
              </Badge>
            )}
          </div>
          <CardDescription>
            A agenda da clínica envia as consultas ao Google. Alterações feitas
            diretamente no Google não modificam a agenda clínica.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {disconnected && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Nenhuma conta Google está conectada para este médico.
              </p>
              {canManage && (
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => void integration.authorize()}
                >
                  {integration.mutation === "authorize" && (
                    <LoaderCircle className="animate-spin" />
                  )}
                  Conectar Google
                </Button>
              )}
            </div>
          )}

          {integration.connection?.status === "PENDENTE" && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">Autorização concluída</p>
                <p className="text-sm text-muted-foreground">
                  Escolha explicitamente o calendário que receberá as consultas.
                </p>
                {integration.connection.google_account_email && (
                  <p className="mt-2 text-sm">
                    Conta: {integration.connection.google_account_email}
                  </p>
                )}
              </div>
              {canManage && (
                <>
                  <CalendarPicker
                    calendars={integration.calendars}
                    value={integration.selectedCalendarId}
                    onChange={integration.setSelectedCalendarId}
                    onSave={() => void saveCalendar()}
                    loading={integration.calendarsLoading}
                    saving={integration.mutation === "select"}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={busy}
                    onClick={() => setDisconnectOpen(true)}
                  >
                    <Unplug /> Desconectar
                  </Button>
                </>
              )}
            </div>
          )}

          {integration.connection?.status === "ATIVA" && (
            <div className="space-y-4">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Conta Google</dt>
                  <dd className="font-medium">
                    {integration.connection.google_account_email ||
                      "Conta conectada"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    Calendário de destino
                  </dt>
                  <dd className="font-medium">
                    {integration.calendars.find(
                      (item) =>
                        item.id === integration.connection?.calendar_id,
                    )?.summary ||
                      (canManage
                        ? integration.calendarsLoading
                          ? "Carregando nome do calendário..."
                          : "O calendário selecionado não está mais disponível."
                        : "Nome disponível somente para quem pode gerenciar a integração.")}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Última sincronização</dt>
                  <dd className="font-medium">
                    {formatLastSync(integration.connection.last_synced_at)}
                  </dd>
                </div>
              </dl>
              {canManage && changingCalendar && (
                <CalendarPicker
                  calendars={integration.calendars}
                  value={integration.selectedCalendarId}
                  onChange={integration.setSelectedCalendarId}
                  onSave={() => void saveCalendar()}
                  loading={integration.calendarsLoading}
                  saving={integration.mutation === "select"}
                  submitLabel="Salvar calendário"
                />
              )}
              {canManage && (
                <div className="flex flex-wrap gap-2">
                  {!changingCalendar && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy || integration.calendarsLoading}
                      onClick={() => void beginCalendarChange()}
                    >
                      {integration.calendarsLoading && (
                        <LoaderCircle className="animate-spin" />
                      )}
                      Alterar calendário
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={busy}
                    onClick={() => setDisconnectOpen(true)}
                  >
                    <Unplug /> Desconectar
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                A sincronização ocorre em segundo plano e pode levar alguns
                instantes.
              </p>
            </div>
          )}

          {integration.connection?.status === "ERRO" && (
            <div className="space-y-4">
              <Alert variant="destructive" role="alert">
                <AlertDescription>
                  {integration.connection.last_error ||
                    "A sincronização encontrou uma falha operacional."}
                </AlertDescription>
              </Alert>
              {canManage && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() => void integration.retry()}
                  >
                    {integration.mutation === "retry" ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <RefreshCcw />
                    )}
                    Tentar novamente
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={busy}
                    onClick={() => setDisconnectOpen(true)}
                  >
                    <Unplug /> Desconectar
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Unplug />
            </AlertDialogMedia>
            <AlertDialogTitle>Desconectar o Google Calendar?</AlertDialogTitle>
            <AlertDialogDescription>
              O acesso será revogado e novas sincronizações serão interrompidas.
              Depois, uma nova conexão poderá ser iniciada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={integration.mutation === "disconnect"}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={integration.mutation === "disconnect"}
              onClick={(event) => {
                event.preventDefault();
                void confirmDisconnect();
              }}
            >
              {integration.mutation === "disconnect" && (
                <LoaderCircle className="animate-spin" />
              )}
              Desconectar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
