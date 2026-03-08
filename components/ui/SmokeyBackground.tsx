"use client"

import { cn } from "@/lib/utils"

interface SmokeyBackgroundProps {
  className?: string
  colors?: [string, string, string, string, string]
  baseColor?: string
  opacity?: number
  blur?: number
  speed?: number
  scale?: number
}

export default function SmokeyBackground({
  className,
  colors = ["#196E76", "#04724D", "#34d399", "#14b8a6", "#0ea5a4"],
  baseColor = "#0a1013",
  opacity = 0.42,
  blur = 95,
  speed = 1,
  scale = 1,
}: SmokeyBackgroundProps) {
  const blobSize = `${42 * scale}vw`
  const minSize = `${260 * scale}px`

  return (
    <div className={cn("fixed inset-0 overflow-hidden", className)} style={{ background: baseColor }}>
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 20% 20%, ${hexToRgba(colors[0], 0.35)}, transparent 45%),
                      radial-gradient(circle at 80% 30%, ${hexToRgba(colors[1], 0.3)}, transparent 50%),
                      radial-gradient(circle at 50% 80%, ${hexToRgba(colors[2], 0.25)}, transparent 55%)`,
        }}
      />

      <div className="smoke-blob smoke-blob-a" style={blobStyle(colors[0], opacity, blur, blobSize, minSize, 14 / speed)} />
      <div className="smoke-blob smoke-blob-b" style={blobStyle(colors[1], opacity, blur, blobSize, minSize, 18 / speed)} />
      <div className="smoke-blob smoke-blob-c" style={blobStyle(colors[2], opacity, blur, blobSize, minSize, 16 / speed)} />
      <div className="smoke-blob smoke-blob-d" style={blobStyle(colors[3], opacity, blur, blobSize, minSize, 20 / speed)} />
      <div className="smoke-blob smoke-blob-e" style={blobStyle(colors[4], opacity, blur, blobSize, minSize, 17 / speed)} />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(3,6,8,0.75)_100%)]" />
    </div>
  )
}

function blobStyle(
  color: string,
  opacity: number,
  blur: number,
  size: string,
  minSize: string,
  duration: number,
): React.CSSProperties {
  return {
    background: `radial-gradient(circle, ${hexToRgba(color, 0.75)} 0%, ${hexToRgba(color, 0)} 68%)`,
    opacity,
    filter: `blur(${blur}px)`,
    width: size,
    height: size,
    minWidth: minSize,
    minHeight: minSize,
    animationDuration: `${Math.max(6, duration)}s`,
  }
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '')
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized
  const bigint = parseInt(value, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
