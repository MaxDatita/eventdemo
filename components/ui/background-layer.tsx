import React from 'react';
import { theme } from '@/config/theme';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { BokehBackground } from '@/components/ui/bokeh';
import SmokeyBackground from '@/components/ui/SmokeyBackground';
import Grainient from '@/components/Grainient';

export function BackgroundLayer() {
  const background = theme.background;

  if (background.mode === 'grainient') {
    const g = background.grainient ?? {};

    return (
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="w-full h-full relative">
          <Grainient
            color1={g.color1 ?? '#04724d'}
            color2={g.color2 ?? '#bbb6cd'}
            color3={g.color3 ?? '#aebaa6'}
            timeSpeed={g.timeSpeed ?? 0.25}
            colorBalance={g.colorBalance ?? -0.44}
            warpStrength={g.warpStrength ?? 1.45}
            warpFrequency={g.warpFrequency ?? 3.3}
            warpSpeed={g.warpSpeed ?? 3.4}
            warpAmplitude={g.warpAmplitude ?? 57}
            blendAngle={g.blendAngle ?? 0}
            blendSoftness={g.blendSoftness ?? 0.05}
            rotationAmount={g.rotationAmount ?? 630}
            noiseScale={g.noiseScale ?? 2}
            grainAmount={g.grainAmount ?? 0.03}
            grainScale={g.grainScale ?? 2}
            grainAnimated={g.grainAnimated ?? false}
            contrast={g.contrast ?? 1.5}
            gamma={g.gamma ?? 1}
            saturation={g.saturation ?? 1}
            centerX={g.centerX ?? 0}
            centerY={g.centerY ?? 0}
            zoom={g.zoom ?? 0.9}
          />
        </div>
      </div>
    );
  }

  if (background.mode === 'gradient') {
    const gradient = background.gradient;
    return (
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: `linear-gradient(140deg, ${gradient.color1} 0%, ${gradient.color2} 55%, ${gradient.color3} 100%)`,
        }}
      />
    );
  }

  if (background.mode === 'bokeh') {
    const base = background.aurora.baseColor || '#07070c';
    const c1 = background.aurora.color1;
    const c2 = background.aurora.color2;
    const c3 = background.aurora.color3;
    const c4 = background.aurora.color4;
    const c5 = background.aurora.color5 || c2;
    const bokeh = background.bokeh || {};

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

  if (background.mode === 'smokey') {
    const c1 = background.aurora.color1;
    const c2 = background.aurora.color2;
    const c3 = background.aurora.color3;
    const c4 = background.aurora.color4;
    const c5 = background.aurora.color5 || c2;
    const base = background.aurora.baseColor || '#0a1013';
    const smokey = background.smokey || {};

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

  if (background.mode !== 'aurora') return null;
  const base = background.aurora.baseColor || '#07070c';

  return (
    <AuroraBackground
      className="fixed inset-0 z-0 pointer-events-none !h-[100dvh] !bg-transparent dark:!bg-transparent"
      style={
        {
          backgroundColor: base,
          '--aurora-color-1': background.aurora.color1,
          '--aurora-color-2': background.aurora.color2,
          '--aurora-color-3': background.aurora.color3,
          '--aurora-color-4': background.aurora.color4,
          '--aurora-color-5': background.aurora.color5 || background.aurora.color2,
          '--aurora-white': base,
          '--aurora-black': base,
          '--aurora-transparent': 'transparent',
          '--aurora-animation-speed': `${background.aurora.animationSpeed || 20}s`,
          opacity: background.aurora.opacity,
          filter: `blur(${background.aurora.blur}px)`,
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
