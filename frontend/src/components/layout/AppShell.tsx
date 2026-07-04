import {
  Activity,
  CalendarClock,
  HeartPulse,
  House,
  UsersRound,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import type { PropsWithChildren } from "react";
import { useAuth } from "../../context/AuthContext";
import { UserInfoCard } from "../ui/UserInfoCard";

const navItems = [
  { to: "/inicio", label: "Início", icon: House },
  { to: "/dashboard", label: "Dashboard", icon: Activity },
  { to: "/pacientes", label: "Pacientes", icon: UsersRound },
  { to: "/agenda", label: "Agenda", icon: CalendarClock },
  { to: "/registros", label: "Registros", icon: HeartPulse },
];

export function AppShell({ children }: PropsWithChildren) {
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-6 text-slate-900 theme-dark:text-slate-100 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-teal-200/70 bg-white/80 p-6 shadow-[0_24px_80px_-30px_rgba(13,148,136,0.55)] backdrop-blur theme-dark:border-slate-700 theme-dark:bg-slate-900/80 theme-dark:shadow-[0_24px_80px_-30px_rgba(15,23,42,0.9)]">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-700">
              Projeto TCC
            </p>
            <h1 className="mt-2 text-3xl text-slate-900 theme-dark:text-slate-100 sm:text-4xl">
              Plataforma de Cuidado em Alzheimer
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 theme-dark:text-slate-300 sm:text-base">
              Suporte clínico, informativo e emocional para familiares e
              pacientes, com foco em acompanhamento contínuo.
            </p>
          </div>
          <UserInfoCard
            nome={user?.nome}
            email={user?.email}
            onLogout={logout}
          />
        </div>
        <nav className="mt-6 flex flex-wrap gap-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "border-teal-500 bg-teal-500 text-white shadow-lg shadow-teal-500/20"
                    : "border-teal-200 bg-white text-slate-700 hover:border-teal-400 hover:text-teal-700 theme-dark:border-slate-600 theme-dark:bg-slate-900 theme-dark:text-slate-200 theme-dark:hover:border-teal-400 theme-dark:hover:text-teal-300"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mt-6">{children}</main>

      <footer className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900 theme-dark:border-amber-900 theme-dark:bg-amber-950/30 theme-dark:text-amber-200">
        <p>
          <strong>Aviso:</strong> este site foi desenvolvido para guiar o
          tratamento de pessoas com diagnóstico comprovado de Alzheimer. O uso
          desta plataforma não dispensa a necessidade de avaliação médica.
        </p>
      </footer>
    </div>
  );
}
