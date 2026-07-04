import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

interface PaginationControlsProps {
  page: number;
  pageSize: number;
  itemCount: number;
  loading?: boolean;
  label: string;
  onPrevious: () => void;
  onNext: () => void;
}

export function PaginationControls({
  page,
  pageSize,
  itemCount,
  loading = false,
  label,
  onPrevious,
  onNext,
}: PaginationControlsProps) {
  const hasPrevious = page > 1;
  const hasNext = itemCount === pageSize;

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 theme-dark:border-slate-700">
      <div>
        <p className="text-sm font-medium text-slate-700 theme-dark:text-slate-200">
          {label}
        </p>
        <p className="text-xs text-slate-500 theme-dark:text-slate-400">
          Página {page} com {itemCount} item(ns) carregado(s).
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasPrevious || loading}
          onClick={onPrevious}
        >
          <ChevronLeft size={14} /> Anterior
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasNext || loading}
          onClick={onNext}
        >
          Próxima <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}
