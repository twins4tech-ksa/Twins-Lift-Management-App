import React from 'react';

interface TwinsBrandFullLogoProps {
  height?: number | string;
  width?: number | string;
  className?: string;
  variant?: 'original' | 'white' | 'card';
  onClick?: () => void;
}

export const TwinsBrandFullLogo: React.FC<TwinsBrandFullLogoProps> = ({
  height = 54,
  width,
  className = '',
  variant = 'card',
  onClick,
}) => {
  const isWhite = variant === 'white';
  const isCard = variant === 'card';

  const textColor = isWhite ? '#FFFFFF' : '#0B1C3F';
  const subTextColor = isWhite ? '#E2E8F0' : '#0B1C3F';
  const goldColor = '#F5A800';

  const svgElement = (
    <svg
      viewBox="0 0 340 200"
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: width ? (typeof width === 'number' ? `${width}px` : width) : 'auto',
      }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 ${className}`}
      aria-label="Twins Technology Building Automation Elevators & Security"
    >
      <defs>
        <linearGradient id="twinsFullGoldLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FAD85D" />
          <stop offset="50%" stopColor="#F2C026" />
          <stop offset="100%" stopColor="#D99E10" />
        </linearGradient>
        <linearGradient id="twinsFullGoldShade" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DF9F12" />
          <stop offset="100%" stopColor="#B37805" />
        </linearGradient>
        <linearGradient id="twinsFullNavyDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0D1B48" />
          <stop offset="100%" stopColor="#050B24" />
        </linearGradient>
      </defs>

      {/* Letter T */}
      <path
        d="M 18 36 L 68 36 L 68 53 L 51 53 L 51 114 L 35 114 L 35 53 L 18 53 Z"
        fill={textColor}
      />

      {/* Building Emblem W (Isometric twin towers & chain) */}
      <g transform="translate(72, 8) scale(0.19)">
        {/* Top Interlocking Chains */}
        <polygon points="250,5 310,65 285,90 225,30" fill="url(#twinsFullGoldLight)" />
        <polygon points="250,5 190,65 215,90 275,30" fill="url(#twinsFullGoldShade)" />
        <polygon points="285,90 310,65 285,40 260,65" fill="url(#twinsFullGoldLight)" />
        <polygon points="215,90 190,65 215,40 240,65" fill="url(#twinsFullGoldShade)" />

        <polygon
          points="250,50 305,105 280,130 225,75"
          fill="url(#twinsFullNavyDark)"
          stroke="#09143C"
          strokeWidth="2"
        />
        <polygon points="250,50 195,105 220,130 275,75" fill="#081033" />
        <polygon points="250,165 190,105 215,80 275,140" fill="url(#twinsFullNavyDark)" />
        <polygon points="250,165 310,105 285,80 225,140" fill="#060C26" />
        <polygon points="250,85 280,115 250,145 220,115" fill="#02040E" />

        <polygon points="275,30 285,40 260,65 250,55" fill="url(#twinsFullGoldLight)" />
        <polygon points="225,30 215,40 240,65 250,55" fill="url(#twinsFullGoldShade)" />
        <polygon points="250,75 270,95 285,80 265,60" fill="url(#twinsFullGoldLight)" />
        <polygon points="250,75 230,95 215,80 235,60" fill="url(#twinsFullGoldShade)" />

        {/* Left Tower */}
        <polygon
          points="20,430 20,190 120,105 150,135 150,175 48,225 48,410"
          fill="url(#twinsFullGoldLight)"
        />
        <polygon points="120,105 150,135 120,165 90,135" fill="url(#twinsFullGoldShade)" />
        <polygon points="60,250 120,195 140,215 80,270" fill="url(#twinsFullGoldLight)" />
        <polygon points="120,195 140,215 120,235 100,215" fill="url(#twinsFullGoldShade)" />
        <polygon points="60,310 120,255 140,275 80,330" fill="url(#twinsFullGoldLight)" />
        <polygon points="120,255 140,275 120,295 100,275" fill="url(#twinsFullGoldShade)" />
        <polygon points="60,370 120,315 140,335 80,390" fill="url(#twinsFullGoldLight)" />
        <polygon points="120,315 140,335 120,355 100,335" fill="url(#twinsFullGoldShade)" />

        {/* Right Tower */}
        <polygon
          points="480,430 480,190 380,105 350,135 350,175 452,225 452,410"
          fill="url(#twinsFullGoldLight)"
        />
        <polygon points="380,105 350,135 380,165 410,135" fill="url(#twinsFullGoldShade)" />
        <polygon points="440,250 380,195 360,215 420,270" fill="url(#twinsFullGoldLight)" />
        <polygon points="380,195 360,215 380,235 400,215" fill="url(#twinsFullGoldShade)" />
        <polygon points="440,310 380,255 360,275 420,330" fill="url(#twinsFullGoldLight)" />
        <polygon points="380,255 360,275 380,295 400,275" fill="url(#twinsFullGoldShade)" />
        <polygon points="440,370 380,315 360,335 420,390" fill="url(#twinsFullGoldLight)" />
        <polygon points="380,315 360,335 380,355 400,335" fill="url(#twinsFullGoldShade)" />

        {/* Chevrons */}
        <polygon
          points="250,225 335,295 315,315 250,260 185,315 165,295"
          fill="url(#twinsFullGoldLight)"
        />
        <polygon
          points="250,225 335,295 335,315 250,245 165,315 165,295"
          fill="url(#twinsFullGoldShade)"
        />
        <polygon
          points="250,285 365,380 345,400 250,320 155,400 135,380"
          fill="url(#twinsFullGoldLight)"
        />
        <polygon
          points="250,285 365,380 365,400 250,305 135,400 135,380"
          fill="url(#twinsFullGoldShade)"
        />
        <polygon
          points="250,345 395,465 375,485 250,380 125,485 105,465"
          fill="url(#twinsFullGoldLight)"
        />
        <polygon
          points="250,345 395,465 395,485 250,365 105,485 105,465"
          fill="url(#twinsFullGoldShade)"
        />

        {/* Base Stripes */}
        <g fill="url(#twinsFullGoldLight)">
          <polygon points="28,450 110,515 98,527 16,462" />
          <polygon points="50,478 125,538 113,550 38,490" />
          <polygon points="80,512 145,564 133,576 68,524" />
          <polygon points="472,450 390,515 402,527 484,462" />
          <polygon points="450,478 375,538 387,550 462,490" />
          <polygon points="420,512 355,564 367,576 432,524" />
        </g>

        {/* Bottom Windows Grid */}
        <g fill={isWhite ? '#050B24' : '#070E33'}>
          <rect x="222" y="475" width="24" height="24" rx="2" />
          <rect x="254" y="475" width="24" height="24" rx="2" />
          <rect x="222" y="507" width="24" height="24" rx="2" />
          <rect x="254" y="507" width="24" height="24" rx="2" />
        </g>
      </g>

      {/* Letters INS */}
      <g fill={textColor}>
        {/* I */}
        <path d="M 172 36 L 188 36 L 188 114 L 172 114 Z" />

        {/* N */}
        <path d="M 200 36 L 216 36 L 239 88 L 239 36 L 253 36 L 253 114 L 238 114 L 214 62 L 214 114 L 200 114 Z" />

        {/* S */}
        <path d="M 318 56 C 318 42 305 35 288 35 C 271 35 260 43 259 56 L 274 57 C 275 49 281 46 288 46 C 297 46 302 50 302 56 C 302 61 297 64 286 67 C 269 72 260 78 260 92 C 260 106 272 115 289 115 C 308 115 320 106 321 91 L 305 90 C 304 98 297 103 289 103 C 280 103 275 99 275 92 C 275 86 281 83 293 80 C 310 74 318 69 318 56 Z" />
      </g>

      {/* Word: TECHNOLOGY */}
      <text
        x="170"
        y="146"
        textAnchor="middle"
        fill={goldColor}
        fontFamily="system-ui, -apple-system, 'Arial Black', Impact, sans-serif"
        fontWeight="900"
        fontSize="29"
        letterSpacing="1.5"
      >
        TECHNOLOGY
      </text>

      {/* Subtitle: BUILDING AUTOMATION */}
      <text
        x="170"
        y="169"
        textAnchor="middle"
        fill={subTextColor}
        fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        fontWeight="800"
        fontSize="12.5"
        letterSpacing="2.2"
      >
        BUILDING AUTOMATION
      </text>

      {/* Subtitle: ELEVATORS & SECURITY */}
      <text
        x="170"
        y="188"
        textAnchor="middle"
        fill={subTextColor}
        fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        fontWeight="800"
        fontSize="12.5"
        letterSpacing="2.8"
      >
        ELEVATORS &amp; SECURITY
      </text>
    </svg>
  );

  if (isCard) {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center p-2 sm:p-2.5 bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] cursor-pointer group ${className}`}
        title="Twins Technology - Building Automation, Elevators & Security"
      >
        {svgElement}
      </div>
    );
  }

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center cursor-pointer focus:outline-hidden"
    >
      {svgElement}
    </button>
  ) : (
    svgElement
  );
};
