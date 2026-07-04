import { Button } from "./Button";

interface UserInfoCardProps {
  nome?: string;
  email?: string;
  onLogout: () => void;
}

export function UserInfoCard({ nome, email, onLogout }: UserInfoCardProps) {
  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-slate-50/90 p-4 theme-dark:border-slate-700 theme-dark:bg-slate-900/70 md:w-auto md:min-w-[340px]">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1 text-xs text-slate-600 theme-dark:text-slate-300">
          <p>
            <span className="font-semibold text-slate-800 theme-dark:text-slate-100">
              Nome completo:
            </span>{" "}
            {nome}
          </p>
          <p>
            <span className="font-semibold text-slate-800 theme-dark:text-slate-100">
              Email:
            </span>{" "}
            {email}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onLogout}>
          Sair
        </Button>
      </div>
    </div>
  );
}
