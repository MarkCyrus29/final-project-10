import React from 'react';
import { Card } from './Card';
import { cn } from '../../lib/cn';

export const DataTable = ({
  columns = [],
  data,
  rows: rowsProp = [],
  keyField,
  rowKey,
  mobileCard,
  className = ''
}) => {
  // Support both `data`/`keyField` (used by admin pages) and `rows`/`rowKey`
  const rows = data || rowsProp;
  const resolveKey = keyField
    ? (row, index) => row[keyField] ?? index
    : rowKey;
  return (
    <div className={className}>
      {/* Desktop View */}
      <div className="hidden md:block print:block">
        <Card padded={false}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-line bg-surface-muted/50">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key || col.header}
                      scope="col"
                      className={cn(
                        'px-4 py-3 text-xs font-medium text-ink-subtle whitespace-nowrap',
                        col.align === 'right' && 'text-right',
                        col.className
                      )}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((row, index) => {
                  const key = resolveKey ? resolveKey(row, index) : row._id || index;
                  return (
                    <tr key={key} className="hover:bg-surface-muted/50 transition-colors">
                      {columns.map((col) => (
                        <td
                          key={col.key || col.header}
                          className={cn(
                            'px-4 py-3 text-ink align-middle',
                            col.align === 'right' && 'text-right tabular-nums',
                            col.className
                          )}
                        >
                          {col.cell ? col.cell(row, index) : row[col.key]}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile View */}
      {mobileCard && (
        <div className="md:hidden print:hidden">
          <ul className="space-y-3">
            {rows.map((row, index) => {
              const key = resolveKey ? resolveKey(row, index) : row._id || index;
              return (
                <li key={key}>
                  <Card className="p-4">
                    {mobileCard(row, index)}
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DataTable;
