import { cn } from "@/lib/utils";
import { LayoutProps } from "./types";

// Table Layout A: Clean professional table
export function TableLayoutA({ content, scheme }: LayoutProps) {
  const table = content.table;
  if (!table) return null;

  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {table.showRowNumbers && (
              <th 
                className="w-12 py-3 px-4 text-left text-xs uppercase tracking-wider"
                style={{ color: scheme.muted }}
              >
                #
              </th>
            )}
            {table.headers.map((header, i) => (
              <th
                key={i}
                className={cn(
                  "py-3 px-4 text-left text-xs uppercase tracking-wider",
                  table.highlightColumn === i && "font-bold"
                )}
                style={{ 
                  color: table.highlightColumn === i ? scheme.accent : scheme.muted,
                  borderBottom: `2px solid ${table.highlightColumn === i ? scheme.accent : scheme.border}`,
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr 
              key={ri}
              style={{ 
                borderBottom: `1px solid ${scheme.border}`,
              }}
            >
              {table.showRowNumbers && (
                <td 
                  className="py-3 px-4 text-sm"
                  style={{ color: scheme.muted }}
                >
                  {ri + 1}
                </td>
              )}
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={cn(
                    "py-3 px-4",
                    ci === 0 ? "font-medium" : "text-base"
                  )}
                  style={{ 
                    color: table.highlightColumn === ci ? scheme.accent : scheme.text,
                    backgroundColor: table.highlightColumn === ci ? `${scheme.accent}10` : 'transparent',
                    fontWeight: table.highlightColumn === ci ? 500 : ci === 0 ? 500 : 300,
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.caption && (
        <p 
          className="mt-3 text-xs italic"
          style={{ color: scheme.muted }}
        >
          {table.caption}
        </p>
      )}
    </div>
  );
}

// Table Layout B: Card-style with highlighted leader column
export function TableLayoutB({ content, scheme }: LayoutProps) {
  const table = content.table;
  if (!table) return null;

  return (
    <div className="mt-8">
      <div 
        className="rounded-lg overflow-hidden"
        style={{ 
          backgroundColor: scheme.card,
          border: `1px solid ${scheme.border}`,
        }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: `${scheme.accent}15` }}>
              {table.showRowNumbers && (
                <th 
                  className="w-12 py-4 px-5 text-left text-xs uppercase tracking-wider"
                  style={{ color: scheme.muted }}
                >
                  #
                </th>
              )}
              {table.headers.map((header, i) => (
                <th
                  key={i}
                  className="py-4 px-5 text-left text-xs uppercase tracking-wider"
                  style={{ 
                    color: table.highlightColumn === i ? scheme.accent : scheme.muted,
                    fontWeight: table.highlightColumn === i ? 600 : 500,
                  }}
                >
                  {header}
                  {table.highlightColumn === i && (
                    <span className="ml-2 text-[10px]">●</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => (
              <tr 
                key={ri}
                style={{ 
                  borderTop: `1px solid ${scheme.border}`,
                }}
              >
                {table.showRowNumbers && (
                  <td 
                    className="py-4 px-5 text-sm"
                    style={{ color: scheme.muted }}
                  >
                    {ri + 1}
                  </td>
                )}
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="py-4 px-5"
                    style={{ 
                      color: table.highlightColumn === ci ? scheme.accent : scheme.text,
                      fontWeight: table.highlightColumn === ci ? 600 : ci === 0 ? 500 : 300,
                      fontSize: table.highlightColumn === ci ? '1.1rem' : '1rem',
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.caption && (
        <p 
          className="mt-4 text-xs text-right"
          style={{ color: scheme.muted }}
        >
          {table.caption}
        </p>
      )}
    </div>
  );
}

// Table Layout C: Compact with accent left border
export function TableLayoutC({ content, scheme }: LayoutProps) {
  const table = content.table;
  if (!table) return null;

  return (
    <div className="mt-8 flex gap-8">
      {/* Accent bar */}
      <div 
        className="w-1 rounded-full shrink-0"
        style={{ backgroundColor: scheme.accent }}
      />
      
      <div className="flex-1">
        <table className="w-full">
          <thead>
            <tr>
              {table.headers.map((header, i) => (
                <th
                  key={i}
                  className="py-2 pr-6 text-left text-sm uppercase tracking-widest"
                  style={{ 
                    color: scheme.muted,
                    fontWeight: 400,
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="py-3 pr-6"
                    style={{ 
                      color: ci === 0 ? scheme.text : table.highlightColumn === ci ? scheme.accent : scheme.muted,
                      fontSize: ci === 0 ? '1rem' : '1.25rem',
                      fontWeight: ci === 0 ? 400 : 300,
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {table.caption && (
          <p 
            className="mt-4 text-xs"
            style={{ color: scheme.muted }}
          >
            {table.caption}
          </p>
        )}
      </div>
    </div>
  );
}
