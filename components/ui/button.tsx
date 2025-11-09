// Para botones de la app

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent'
}

const buttonVariants = {
  primary: "bg-pink-500 hover:bg-pink-500 text-white border-transparent rounded-2xl dark:bg-pink-600 dark:hover:bg-pink-600",
  secondary: "bg-white hover:bg-white text-bg-pink-500 border border-pink-500 rounded-2xl dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white",
  accent: "bg-fuchsia-800 hover:bg-fuchsia-900 text-white border-transparent rounded-2xl dark:bg-fuchsia-900 dark:hover:bg-fuchsia-800"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        className={cn(
          "px-4 py-2 rounded-md transition-colors font-medium",
          buttonVariants[variant],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"
