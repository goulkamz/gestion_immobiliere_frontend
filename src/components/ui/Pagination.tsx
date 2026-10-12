import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number; // 0-indexé (aligné sur Pageable Spring)
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, totalElements, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i).filter(
    (p) => p === 0 || p === totalPages - 1 || Math.abs(p - currentPage) <= 1,
  );

  return (
    <nav className="flex items-center justify-between gap-4 py-3" aria-label="Pagination">
      <p className="text-sm text-slate-500">
        {totalElements} résultat{totalElements > 1 ? "s" : ""}
      </p>
      <ul className="flex items-center gap-1">
        <li>
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
            aria-label="Page précédente"
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-primary-50 hover:text-primary-700 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ChevronLeft size={18} />
          </button>
        </li>
        {pages.map((page, index) => {
          const previous = pages[index - 1];
          const showEllipsis = previous !== undefined && page - previous > 1;
          return (
            <li key={page} className="flex items-center gap-1">
              {showEllipsis && <span className="px-1 text-slate-400">…</span>}
              <button
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={page === currentPage ? "page" : undefined}
                className={`h-9 min-w-9 rounded-full px-2 text-sm font-medium transition-colors ${
                  page === currentPage
                    ? "bg-primary-600 text-white shadow-sm shadow-primary-600/25"
                    : "text-slate-600 hover:bg-primary-50 hover:text-primary-700"
                }`}
              >
                {page + 1}
              </button>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
            aria-label="Page suivante"
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-primary-50 hover:text-primary-700 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ChevronRight size={18} />
          </button>
        </li>
      </ul>
    </nav>
  );
}
