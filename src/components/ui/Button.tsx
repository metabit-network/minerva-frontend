import * as React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'cyber' | 'neon' | 'hologram';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  glow?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', glow = false, ...props }, ref) => {
    const baseStyles = 'relative inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group';

    const variants = {
      default: 'bg-card text-card-foreground border border-border hover:bg-muted shadow-sm rounded-lg',

      primary: `
        bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%]
        text-white rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.3)]
        hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:bg-[position:100%_0%]
        before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent
        before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700
      `,

      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-hover border border-border shadow-sm rounded-lg',

      outline: `
        border-2 border-primary/50 bg-transparent text-primary rounded-lg backdrop-blur-sm
        hover:border-primary hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]
        before:absolute before:inset-0 before:border-2 before:border-transparent
        before:bg-gradient-to-r before:from-primary/0 before:via-primary/30 before:to-primary/0
        before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
      `,

      ghost: 'hover:bg-muted hover:text-foreground rounded-lg',

      destructive: `
        bg-gradient-to-r from-destructive to-red-600 text-white rounded-lg
        shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]
        hover:scale-105 active:scale-95
      `,

      success: `
        bg-gradient-to-r from-success to-emerald-600 text-white rounded-lg
        shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]
        hover:scale-105 active:scale-95
      `,

      cyber: `
        bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-cyan-400
        border-2 border-cyan-500/50 rounded-none clip-path-cyber shadow-[0_0_20px_rgba(6,182,212,0.3)]
        hover:border-cyan-400 hover:text-cyan-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]
        before:absolute before:inset-0 before:bg-gradient-to-r before:from-cyan-500/0 before:via-cyan-500/20 before:to-cyan-500/0
        before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-500
      `,

      neon: `
        bg-black text-cyan-400 border-2 border-cyan-500 rounded-lg font-mono
        shadow-[0_0_10px_rgba(6,182,212,0.5),0_0_20px_rgba(6,182,212,0.3),0_0_30px_rgba(6,182,212,0.1)]
        hover:text-cyan-300 hover:border-cyan-400
        hover:shadow-[0_0_15px_rgba(6,182,212,0.7),0_0_25px_rgba(6,182,212,0.5),0_0_35px_rgba(6,182,212,0.3)]
        animate-pulse-subtle
      `,

      hologram: `
        bg-gradient-to-r from-purple-900/50 via-blue-900/50 to-cyan-900/50
        text-white border border-cyan-400/50 rounded-lg backdrop-blur-md
        shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]
        before:absolute before:inset-0 before:bg-gradient-to-r
        before:from-purple-500/20 before:via-blue-500/20 before:to-cyan-500/20
        before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
        after:absolute after:inset-0 after:bg-gradient-to-45deg after:from-transparent after:via-white/10 after:to-transparent
        after:translate-x-[-100%] hover:after:translate-x-[100%] after:transition-transform after:duration-700
      `
    };

    const sizes = {
      sm: 'h-8 px-3 text-sm',
      default: 'h-10 px-4 py-2 text-sm',
      lg: 'h-12 px-6 text-base',
      icon: 'h-10 w-10',
    };

    const glowEffect = glow ? 'animate-pulse-subtle shadow-[0_0_20px_rgba(59,130,246,0.4)]' : '';

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          glowEffect,
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };