// Para botones de la app

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'invitation'
}

const buttonVariants = {
  primary: "bg-[#FF914E] hover:bg-[#ff8132] text-white border-transparent rounded-2xl",
  secondary: "bg-[#FFF4DC] hover:bg-[#FFEDC8] text-[#B95D1B] border border-[#FFCF6E] rounded-2xl",
  accent: "bg-[#FFCF6E] hover:bg-[#ffc24f] text-[#8A4A14] border-transparent rounded-2xl",
  invitation: "bg-[#04724d] hover:bg-[#036340] text-white border-transparent rounded-2xl",
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
