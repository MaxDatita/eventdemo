import React from 'react';
import { theme } from '@/config/theme';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { BokehBackground } from '@/components/ui/bokeh';
import SmokeyBackground from '@/components/ui/SmokeyBackground';

export function BackgroundLayer() {
  if (theme.background.mode === 'gradient') {
    const gradient = theme.background.gradient;
    return (
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: `linear-gradient(140deg, ${gradient.color1} 0%, ${gradient.color2} 55%, ${gradient.color3} 100%)`,
        }}
      />
    );
  }

  if (theme.background.mode === 'bokeh') {
    const base = theme.background.aurora.baseColor || '#07070c';
    const c1 = theme.background.aurora.color1;
    const c2 = theme.background.aurora.color2;
    const c3 = theme.background.aurora.color3;
    const c4 = theme.background.aurora.color4;
    const c5 = theme.background.aurora.color5 || c2;
    const bokeh = theme.background.bokeh || {};

    const colors = [
      `${hexToRgba(c1, 0.32)}`,
      `${hexToRgba(c2, 0.28)}`,
      `${hexToRgba(c3, 0.24)}`,
      `${hexToRgba(c4, 0.26)}`,
      `${hexToRgba(c5, 0.22)}`,
    ];

    return (
      <BokehBackground
        className="fixed inset-0 z-0 pointer-events-none"
        count={bokeh.count || 24}
        minSize={bokeh.minSize || 60}
        maxSize={bokeh.maxSize || 220}
        speed={bokeh.speed || 0.8}
        colors={colors}
        baseColor={base}
        overlayColor={hexToRgba(c2, bokeh.overlayOpacity || 0.16)}
        vignetteColor={hexToRgba(base, bokeh.vignetteOpacity || 0.7)}
      />
    );
  }

  if (theme.background.mode === 'smokey') {
    const c1 = theme.background.aurora.color1;
    const c2 = theme.background.aurora.color2;
    const c3 = theme.background.aurora.color3;
    const c4 = theme.background.aurora.color4;
    const c5 = theme.background.aurora.color5 || c2;
    const base = theme.background.aurora.baseColor || '#0a1013';
    const smokey = theme.background.smokey || {};

    return (
      <SmokeyBackground
        className="fixed inset-0 z-0 pointer-events-none"
        colors={[c1, c2, c3, c4, c5]}
        baseColor={base}
        opacity={smokey.opacity || 0.42}
        blur={smokey.blur || 95}
        speed={smokey.speed || 1}
        scale={smokey.scale || 1}
      />
    );
  }

  if (theme.background.mode !== 'aurora') return null;
  const base = theme.background.aurora.baseColor || '#07070c';

  return (
    <AuroraBackground
      className="fixed inset-0 z-0 pointer-events-none !h-[100dvh] !bg-transparent dark:!bg-transparent"
      style={
        {
          backgroundColor: base,
          '--aurora-color-1': theme.background.aurora.color1,
          '--aurora-color-2': theme.background.aurora.color2,
          '--aurora-color-3': theme.background.aurora.color3,
          '--aurora-color-4': theme.background.aurora.color4,
          '--aurora-color-5': theme.background.aurora.color5 || theme.background.aurora.color2,
          '--aurora-white': base,
          '--aurora-black': base,
          '--aurora-transparent': 'transparent',
          '--aurora-animation-speed': `${theme.background.aurora.animationSpeed || 20}s`,
          opacity: theme.background.aurora.opacity,
          filter: `blur(${theme.background.aurora.blur}px)`,
        } as React.CSSProperties
      }
    >
      <div />
    </AuroraBackground>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized;
  const bigint = parseInt(value, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
