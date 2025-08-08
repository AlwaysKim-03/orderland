import { useState } from "react";
import { cn } from "../../lib/utils";
import { Users, Clock, CheckCircle2 } from "lucide-react";

export type TableStatus = "empty" | "occupied" | "served";
export type GridSize = "4x3" | "5x3" | "5x5" | "5x10";

interface Table {
  id: string;
  number: number;
  status: TableStatus;
  guests?: number;
  orderTime?: string;
  orders?: string[];
}

interface TableGridProps {
  tables: Table[];
  gridSize: GridSize;
  onTableClick: (table: Table) => void;
  className?: string;
}

const GRID_CONFIGS = {
  "4x3": { cols: 4, rows: 3 },
  "5x3": { cols: 5, rows: 3 },
  "5x5": { cols: 5, rows: 5 },
  "5x10": { cols: 5, rows: 10 }
};

export function TableGrid({ tables, gridSize, onTableClick, className }: TableGridProps) {
  const config = GRID_CONFIGS[gridSize];
  const totalTables = config.cols * config.rows;
  
  // Create array with all table slots, fill missing ones with empty tables
  const tableSlots = Array.from({ length: totalTables }, (_, index) => {
    const tableNumber = index + 1;
    return tables.find(t => t.number === tableNumber) || {
      id: `empty-${tableNumber}`,
      number: tableNumber,
      status: "empty" as TableStatus
    };
  });

  const getStatusIcon = (status: TableStatus, guests?: number) => {
    switch (status) {
      case "occupied":
        return <Users className="w-5 h-5" />;
      case "served":
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-dashed border-muted-foreground/50" />;
    }
  };

  const getStatusStyles = (status: TableStatus) => {
    switch (status) {
      case "empty":
        return "bg-gray-100 text-gray-600 border border-dashed border-gray-300 hover:bg-gray-200";
      case "occupied":
        return "bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600";
      case "served":
        return "bg-green-500 text-white shadow-lg shadow-green-500/20 hover:bg-green-600";
    }
  };

  return (
    <div className={cn("p-4", className)}>
      <div 
        className="grid gap-3 mx-auto"
        style={{
          gridTemplateColumns: `repeat(${Math.min(config.cols, 4)}, 1fr)`,
          gridTemplateRows: `repeat(${Math.ceil((config.cols * config.rows) / Math.min(config.cols, 4))}, 1fr)`,
          maxWidth: `${Math.min(config.cols, 4) * 85}px`
        }}
      >
        {tableSlots.map((table) => (
          <button
            key={table.id}
            onClick={() => onTableClick(table)}
            className={cn(
              "relative aspect-square rounded-xl",
              "flex flex-col items-center justify-center",
              "transition-all duration-300 active:scale-95",
              "touch-manipulation",
              "min-h-[70px] font-medium",
              "transform-gpu",
              table.status !== "empty" && "animate-in fade-in-0 zoom-in-75 duration-300",
              getStatusStyles(table.status)
            )}
          >
            <div className="flex flex-col items-center space-y-1">
              {getStatusIcon(table.status, table.guests)}
              <span className="text-sm font-bold">
                T-{table.number.toString().padStart(2, '0')}
              </span>
              {table.status === "occupied" && table.orderTime && (
                <span className="text-xs opacity-75 font-medium">
                  {table.orderTime}
                </span>
              )}
              {table.guests && (
                <span className="text-xs opacity-75">
                  {table.guests}명
                </span>
              )}
            </div>
            
            {table.orderTime && (
              <div className="absolute top-1 right-1">
                <Clock className="w-3 h-3 opacity-60" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}