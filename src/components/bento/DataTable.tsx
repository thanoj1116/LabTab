import React from "react";

interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No records found.",
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-control border border-border-subtle bg-surface-1">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="sticky top-0 bg-surface-2 border-b border-border-subtle z-10">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`py-3 px-4 text-[11px] font-semibold text-primary-muted uppercase tracking-wider ${col.className || ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-8 px-4 text-center text-primary-muted font-normal"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick?.(row)}
                className={`transition-colors ${
                  onRowClick
                    ? "cursor-pointer hover:bg-surface-2"
                    : "hover:bg-surface-2/60"
                }`}
              >
                {columns.map((col, idx) => (
                  <td
                    key={idx}
                    className={`py-3 px-4 text-primary font-normal ${col.className || ""}`}
                  >
                    {col.cell
                      ? col.cell(row)
                      : col.accessorKey
                      ? String(row[col.accessorKey] ?? "")
                      : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
