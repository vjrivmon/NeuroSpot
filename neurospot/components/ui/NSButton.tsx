"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const variantStyles = {
  primary:
    "bg-primary text-white hover:bg-primary-dark active:bg-primary-dark shadow-md hover:shadow-lg",
  secondary:
    "bg-surface text-gray-700 border-2 border-gray-300 hover:bg-gray-200 active:bg-gray-300",
  danger:
    "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-md",
} as const

const sizeStyles = {
  sm: "min-h-[48px] px-5 py-2 text-base rounded-xl",
  md: "min-h-[56px] px-7 py-3 text-lg rounded-2xl",
  lg: "min-h-[64px] px-10 py-4 text-xl rounded-2xl",
} as const

export interface NSButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles
  size?: keyof typeof sizeStyles
}

const NSButton = React.forwardRef<HTMLButtonElement, NSButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold",
          "transition-all duration-150 ease-in-out",
          "active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
          "disabled:opacity-50 disabled:pointer-events-none",
          "select-none cursor-pointer",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)
NSButton.displayName = "NSButton"

export { NSButton }
