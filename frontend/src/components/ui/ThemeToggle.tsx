import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="fixed right-4 top-4 z-50 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-md backdrop-blur transition hover:border-teal-500 hover:text-teal-700 theme-dark:border-slate-600 theme-dark:bg-slate-900/90 theme-dark:text-slate-100 theme-dark:hover:border-teal-400 theme-dark:hover:text-teal-300"
      aria-label="Alternar modo escuro"
      title={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      {isDark ? "Modo claro" : "Modo escuro"}
    </button>
  );
}
