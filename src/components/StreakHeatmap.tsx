"use client";

import { useAppSelector } from "@/lib/store";
import { motion } from "framer-motion";
import dayjs from "dayjs";

export default function StreakHeatmap() {
  const { solvedPuzzles } = useAppSelector((state) => state.game);
  
  // Generate 28 days for the heatmap
  const today = dayjs();
  const days = Array.from({ length: 28 }).map((_, i) => {
    const date = today.subtract(27 - i, "day").format("YYYY-MM-DD");
    return {
      date,
      solved: !!solvedPuzzles[date],
    };
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, i) => (
          <motion.div 
            key={day.date}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.01, type: "spring", stiffness: 300, damping: 20 }}
            className={`
              w-full aspect-square rounded-[4px] relative group
              ${day.solved 
                ? "bg-primary shadow-sm shadow-primary/20" 
                : "bg-light-blue/20 border-[0.5px] border-light-blue/50"}
            `}
          >
            {/* Tooltip on Hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-deep text-white text-[8px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {dayjs(day.date).format("MMM D")}: {day.solved ? "Solved" : "Missed"}
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="flex justify-between items-center px-0.5">
        <span className="text-[10px] font-black text-foreground/20 uppercase tracking-widest">
          {today.subtract(27, "day").format("MMM D")}
        </span>
        <div className="flex items-center gap-1.5">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-[2px] bg-light-blue/20" />
            <div className="w-2 h-2 rounded-[2px] bg-primary" />
          </div>
          <span className="text-[10px] font-black text-foreground/20 uppercase tracking-widest">
            {today.format("MMM D")}
          </span>
        </div>
      </div>
    </div>
  );
}
