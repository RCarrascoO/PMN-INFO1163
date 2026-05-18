import { ElementType } from 'react';

interface ActionButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'secondary';
  icon?: ElementType;
}

export const ActionButton = ({ onClick, children, variant = 'primary', icon: Icon }: ActionButtonProps) => {
  const baseStyle = "w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-3 font-semibold text-white transition-all transform active:scale-95 shadow-lg";
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500",
    success: "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400",
    danger: "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500",
    warning: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 shadow-none",
  };

  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]}`}>
      {Icon && <Icon size={20} />}
      {children}
    </button>
  );
};
