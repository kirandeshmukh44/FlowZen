import React from 'react';
import { FileText, Gauge, CheckCircle2, Sparkles } from 'lucide-react';

export const KpiCard = ({ title, value, type, trendData, icon: IconComponent }) => {
  return (
    <div className="glass-card p-4 sm:p-5 flex items-center justify-between min-h-[105px] relative overflow-hidden group">
      {/* Subtle background glow */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-accent/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

      {/* Metric Info */}
      <div className="flex flex-col justify-between z-10">
        <div className="flex items-center gap-2 mb-2 text-accent dark:text-accent text-xs font-semibold uppercase tracking-wider">
          <span>{title}</span>
          {IconComponent && <IconComponent size={14} className="opacity-70" />}
        </div>
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-zen-textDark dark:text-zen-textLight">
          {value}
        </div>
      </div>

      {/* Sparkline Visual */}
      <div className="z-10 w-24 h-12 flex items-end justify-end">
        {type === 'area' ? (
          // Smooth Area Sparkline for Velocity
          <svg className="w-24 h-10 overflow-visible" viewBox="0 0 100 40">
            <defs>
              <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C98A8F" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#C98A8F" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M 0 35 Q 25 15, 50 28 T 100 10 L 100 40 L 0 40 Z"
              fill="url(#roseGradient)"
            />
            <path
              d="M 0 35 Q 25 15, 50 28 T 100 10"
              fill="none"
              stroke="#C98A8F"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          // Vertical Bar Sparkline
          <div className="flex items-end gap-1.5 h-10">
            {[35, 55, 40, 75, 60, 90, 80].map((heightPercent, idx) => (
              <div
                key={idx}
                style={{ height: `${heightPercent}%` }}
                className={`w-1.5 rounded-full transition-all duration-300 ${
                  idx >= 5 ? 'bg-accent shadow-sm' : 'bg-accent/30 dark:bg-accent/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KpiCard;

