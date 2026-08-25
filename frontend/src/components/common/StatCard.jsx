import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  subvalue,
  change,
  trend = 'up', // 'up', 'down', 'neutral'
  icon: Icon,
  colorScheme = 'blue', // 'blue', 'emerald', 'amber', 'red', 'cyan', 'purple'
  onClick,
  progress = null,
  badge = null
}) => {
  const getColorClasses = (scheme) => {
    switch (scheme) {
      case 'emerald':
        return {
          iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          badgeBg: 'bg-emerald-500/20 text-emerald-300',
          accent: 'from-emerald-500/10 via-transparent to-transparent',
          border: 'hover:border-emerald-500/40',
          bar: 'bg-emerald-500'
        };
      case 'amber':
        return {
          iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          badgeBg: 'bg-amber-500/20 text-amber-300',
          accent: 'from-amber-500/10 via-transparent to-transparent',
          border: 'hover:border-amber-500/40',
          bar: 'bg-amber-500'
        };
      case 'red':
        return {
          iconBg: 'bg-red-500/10 text-red-400 border-red-500/20',
          badgeBg: 'bg-red-500/20 text-red-300',
          accent: 'from-red-500/10 via-transparent to-transparent',
          border: 'hover:border-red-500/40',
          bar: 'bg-red-500'
        };
      case 'cyan':
        return {
          iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          badgeBg: 'bg-cyan-500/20 text-cyan-300',
          accent: 'from-cyan-500/10 via-transparent to-transparent',
          border: 'hover:border-cyan-500/40',
          bar: 'bg-cyan-500'
        };
      case 'purple':
        return {
          iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          badgeBg: 'bg-purple-500/20 text-purple-300',
          accent: 'from-purple-500/10 via-transparent to-transparent',
          border: 'hover:border-purple-500/40',
          bar: 'bg-purple-500'
        };
      case 'blue':
      default:
        return {
          iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          badgeBg: 'bg-blue-500/20 text-blue-300',
          accent: 'from-blue-500/10 via-transparent to-transparent',
          border: 'hover:border-blue-500/40',
          bar: 'bg-blue-500'
        };
    }
  };

  const theme = getColorClasses(colorScheme);

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 transition-all duration-200 shadow-lg ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-blue-500/5' : ''
      } ${theme.border}`}
    >
      {/* Background Gradient Accent */}
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.accent} pointer-events-none`} />

      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <div className="flex items-baseline space-x-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono">
              {value}
            </h3>
            {subvalue && (
              <span className="text-xs text-slate-400 font-medium">
                {subvalue}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div className={`p-2.5 sm:p-3 rounded-xl border ${theme.iconBg} shrink-0 shadow-sm`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        )}
      </div>

      {/* Optional Progress Bar */}
      {typeof progress === 'number' && (
        <div className="relative mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${theme.bar}`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}

      {/* Footer / Trend Indicator */}
      <div className="relative mt-3 flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
        {change && (
          <div className="flex items-center space-x-1 font-medium">
            {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
            {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
            {trend === 'neutral' && <Minus className="w-3.5 h-3.5 text-slate-400" />}
            <span
              className={
                trend === 'up'
                  ? 'text-emerald-400'
                  : trend === 'down'
                  ? 'text-red-400'
                  : 'text-slate-400'
              }
            >
              {change}
            </span>
          </div>
        )}

        {badge && (
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${theme.badgeBg}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
