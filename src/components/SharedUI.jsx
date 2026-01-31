import React from 'react';

export const Button = ({ children, onClick, variant = 'primary', className = '', icon: Icon, disabled }) => {
  const baseStyle = "w-full py-4 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/20 border border-violet-500/50",
    secondary: "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700",
    accent: "bg-emerald-600 text-white shadow-lg border border-emerald-500/50",
    ghost: "bg-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={20} />}
      {children}
    </button>
  );
};

export const Card = ({ children, className = '', title, highlight = false }) => (
  <div className={`backdrop-blur-xl rounded-2xl p-6 border transition-all duration-500 ${
    highlight ? 'bg-zinc-900/90 border-rose-500/50 shadow-rose-900/20' : 'bg-zinc-900/60 border-zinc-800/50 shadow-xl'
  } ${className}`}>
    {title && <h3 className="text-lg font-semibold text-white mb-4 tracking-tight">{title}</h3>}
    {children}
  </div>
);

export const MiniBattery = ({ level, label }) => {
  const colors = {
    1: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]',
    2: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]',
    3: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
  };
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-10 h-14 border-2 border-zinc-700 rounded-lg p-1 bg-zinc-950 flex flex-col-reverse gap-0.5">
        <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-zinc-700 rounded-t-sm`} />
        {[1, 2, 3].map(seg => (
          <div key={seg} className={`flex-1 rounded-sm transition-all duration-500 ${level >= seg ? colors[level] : 'bg-zinc-900'}`} />
        ))}
      </div>
      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">{label}</span>
    </div>
  );
};