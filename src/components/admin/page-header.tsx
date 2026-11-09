import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  backAction,
  actions,
}: {
  title: string;
  description: string;
  backAction?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className={cn(backAction && "grid grid-cols-[auto_1fr] gap-x-2")}>
        {backAction && <div className="shrink-0">{backAction}</div>}
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
