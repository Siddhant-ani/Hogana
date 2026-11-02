import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-semibold rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none shadow-2xs";

  const variants = {
    primary:
      "bg-[#0F8278] text-white hover:bg-[#0c6961] active:bg-[#094e48] focus-visible:ring-[#0F8278]",
    secondary:
      "bg-[#EAF4F7] text-[#12233F] hover:bg-[#d8edf3] active:bg-[#cbe3ec] focus-visible:ring-[#0F8278] border border-[#DCE5ED]",
    outline:
      "bg-white text-[#12233F] hover:bg-[#F5F7FA] active:bg-[#EAF4F7] focus-visible:ring-[#0F8278] border border-[#DCE5ED]",
    danger:
      "bg-[#DC2626] text-white hover:bg-[#b91c1c] active:bg-[#991b1b] focus-visible:ring-[#DC2626]",
    ghost:
      "bg-transparent text-[#12233F] hover:bg-[#EAF4F7] active:bg-[#d8edf3] focus-visible:ring-[#0F8278] shadow-none"
  }[variant];

  const sizes = {
    sm: "px-2.5 py-1.5 text-xs gap-1.5",
    md: "px-3.5 py-2 text-xs sm:text-sm gap-2",
    lg: "px-5 py-2.5 text-sm sm:text-base gap-2.5"
  }[size];

  return (
    <button
      className={`${base} ${variants} ${sizes} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
}
