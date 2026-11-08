import { ShieldAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function AccessDenied() {
  return (
    <Alert>
      <ShieldAlert />
      <AlertTitle>Acesso negado</AlertTitle>
      <AlertDescription>
        Você não possui permissão para visualizar esta área.
      </AlertDescription>
    </Alert>
  );
}
