import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";
import { EmptyState } from "./EmptyState";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  align?: "left" | "right" | "center";
  hiddenOnMobile?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  keyExtractor: (row: T) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({ data, columns, keyExtractor, loading, emptyMessage, onRowClick }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const column = columns.find((c) => c.key === sortKey);
    if (!column?.sortValue) return data;
    const sorted = [...data].sort((a, b) => {
      const va = column.sortValue!(a);
      const vb = column.sortValue!(b);
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [data, sortKey, sortDir, columns]);

  function toggleSort(key: string) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }
  }

  if (loading) return <LoadingSpinner text="Chargement des données…" />;
  if (data.length === 0) return <EmptyState title={emptyMessage ?? "Aucune donnée à afficher"} />;

  return (
    <div className="max-h-128 overflow-auto rounded-2xl border border-primary-100/60 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 z-10 border-b border-primary-100 bg-primary-50 text-xs font-semibold uppercase tracking-wide text-primary-800">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-3.5 py-2 ${column.hiddenOnMobile ? "hidden md:table-cell" : ""} ${
                  column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : ""
                }`}
              >
                {column.sortable ? (
                  <button
                    type="button"
                    onClick={() => toggleSort(column.key)}
                    className="inline-flex items-center gap-1 transition-colors hover:text-primary-900"
                  >
                    {column.header}
                    {sortKey === column.key ? (
                      sortDir === "asc" ? (
                        <ArrowUp size={12} />
                      ) : (
                        <ArrowDown size={12} />
                      )
                    ) : (
                      <ArrowUpDown size={12} className="opacity-40" />
                    )}
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sortedData.map((row) => (
            <tr
              key={keyExtractor(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`transition-colors hover:bg-primary-50/40 ${onRowClick ? "cursor-pointer" : ""}`}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-3.5 py-1 text-slate-700 ${column.hiddenOnMobile ? "hidden md:table-cell" : ""} ${
                    column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : ""
                  }`}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
