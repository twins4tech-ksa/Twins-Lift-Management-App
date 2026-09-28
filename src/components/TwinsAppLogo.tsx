import React from 'react';

interface TwinsAppLogoProps {
  size?: number;
  className?: string;
}

export const TwinsAppLogo: React.FC<TwinsAppLogoProps> = ({
  size = 48,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 500 560"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="Twins Technology Logo"
    >
      <defs>
        {/* Gradients for rich 3D gold finish */}
        <linearGradient id="goldLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FAD85D" />
          <stop offset="50%" stopColor="#F2C026" />
          <stop offset="100%" stopColor="#D99E10" />
        </linearGradient>

        <linearGradient id="goldShade" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DF9F12" />
          <stop offset="100%" stopColor="#B37805" />
        </linearGradient>

        <linearGradient id="navyDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0D1B48" />
          <stop offset="100%" stopColor="#050B24" />
        </linearGradient>
      </defs>

      {/* 1. TOP INTERLOCKING CHAINS */}
      {/* Top Gold Loop */}
      <g>
        {/* Top Gold Isometric Ring Outer Face */}
        <polygon
          points="250,5 310,65 285,90 225,30"
          fill="url(#goldLight)"
        />
        <polygon
          points="250,5 190,65 215,90 275,30"
          fill="url(#goldShade)"
        />
        <polygon
          points="285,90 310,65 285,40 260,65"
          fill="url(#goldLight)"
        />
        <polygon
          points="215,90 190,65 215,40 240,65"
          fill="url(#goldShade)"
        />
      </g>

      {/* Interlinked Navy Loop */}
      <g>
        <polygon
          points="250,50 305,105 280,130 225,75"
          fill="url(#navyDark)"
          stroke="#09143C"
          strokeWidth="2"
        />
        <polygon
          points="250,50 195,105 220,130 275,75"
          fill="#081033"
        />
        <polygon
          points="250,165 190,105 215,80 275,140"
          fill="url(#navyDark)"
        />
        <polygon
          points="250,165 310,105 285,80 225,140"
          fill="#060C26"
        />
        {/* Center Cutout for Navy Ring */}
        <polygon
          points="250,85 280,115 250,145 220,115"
          fill="#02040E"
        />
      </g>

      {/* Re-overlaid Gold segment to complete interlacing */}
      <polygon
        points="275,30 285,40 260,65 250,55"
        fill="url(#goldLight)"
      />
      <polygon
        points="225,30 215,40 240,65 250,55"
        fill="url(#goldShade)"
      />
      <polygon
        points="250,75 270,95 285,80 265,60"
        fill="url(#goldLight)"
      />
      <polygon
        points="250,75 230,95 215,80 235,60"
        fill="url(#goldShade)"
      />

      {/* 2. LEFT TOWER / WING */}
      <g>
        {/* Outer Frame */}
        <polygon
          points="20,430 20,190 120,105 150,135 150,175 48,225 48,410"
          fill="url(#goldLight)"
        />
        <polygon
          points="120,105 150,135 120,165 90,135"
          fill="url(#goldShade)"
        />
        {/* Floor 1 (Top) */}
        <polygon
          points="60,250 120,195 140,215 80,270"
          fill="url(#goldLight)"
        />
        <polygon
          points="120,195 140,215 120,235 100,215"
          fill="url(#goldShade)"
        />
        {/* Floor 2 (Middle) */}
        <polygon
          points="60,310 120,255 140,275 80,330"
          fill="url(#goldLight)"
        />
        <polygon
          points="120,255 140,275 120,295 100,275"
          fill="url(#goldShade)"
        />
        {/* Floor 3 (Bottom) */}
        <polygon
          points="60,370 120,315 140,335 80,390"
          fill="url(#goldLight)"
        />
        <polygon
          points="120,315 140,335 120,355 100,335"
          fill="url(#goldShade)"
        />
      </g>

      {/* 3. RIGHT TOWER / WING (Mirrored) */}
      <g>
        {/* Outer Frame */}
        <polygon
          points="480,430 480,190 380,105 350,135 350,175 452,225 452,410"
          fill="url(#goldLight)"
        />
        <polygon
          points="380,105 350,135 380,165 410,135"
          fill="url(#goldShade)"
        />
        {/* Floor 1 (Top) */}
        <polygon
          points="440,250 380,195 360,215 420,270"
          fill="url(#goldLight)"
        />
        <polygon
          points="380,195 360,215 380,235 400,215"
          fill="url(#goldShade)"
        />
        {/* Floor 2 (Middle) */}
        <polygon
          points="440,310 380,255 360,275 420,330"
          fill="url(#goldLight)"
        />
        <polygon
          points="380,255 360,275 380,295 400,275"
          fill="url(#goldShade)"
        />
        {/* Floor 3 (Bottom) */}
        <polygon
          points="440,370 380,315 360,335 420,390"
          fill="url(#goldLight)"
        />
        <polygon
          points="380,315 360,335 380,355 400,335"
          fill="url(#goldShade)"
        />
      </g>

      {/* 4. CENTER PYRAMID CHEVRONS */}
      <g>
        {/* Chevron Tier 1 (Apex Top) */}
        <polygon
          points="250,225 335,295 315,315 250,260 185,315 165,295"
          fill="url(#goldLight)"
        />
        <polygon
          points="250,225 335,295 335,315 250,245 165,315 165,295"
          fill="url(#goldShade)"
        />

        {/* Chevron Tier 2 (Middle) */}
        <polygon
          points="250,285 365,380 345,400 250,320 155,400 135,380"
          fill="url(#goldLight)"
        />
        <polygon
          points="250,285 365,380 365,400 250,305 135,400 135,380"
          fill="url(#goldShade)"
        />

        {/* Chevron Tier 3 (Lower Base) */}
        <polygon
          points="250,345 395,465 375,485 250,380 125,485 105,465"
          fill="url(#goldLight)"
        />
        <polygon
          points="250,345 395,465 395,485 250,365 105,485 105,465"
          fill="url(#goldShade)"
        />
      </g>

      {/* 5. RADIATING STRIPES AT BASE */}
      {/* Left Base Stripes */}
      <g fill="url(#goldLight)">
        <polygon points="28,450 110,515 98,527 16,462" />
        <polygon points="50,478 125,538 113,550 38,490" />
        <polygon points="80,512 145,564 133,576 68,524" />
      </g>

      {/* Right Base Stripes */}
      <g fill="url(#goldLight)">
        <polygon points="472,450 390,515 402,527 484,462" />
        <polygon points="450,478 375,538 387,550 462,490" />
        <polygon points="420,512 355,564 367,576 432,524" />
      </g>

      {/* 6. CENTER ELEVATOR WINDOW (2x2 Grid) */}
      <g fill="#070E33" stroke="#050B26" strokeWidth="1">
        {/* Top-Left */}
        <rect x="222" y="475" width="24" height="24" rx="2" />
        {/* Top-Right */}
        <rect x="254" y="475" width="24" height="24" rx="2" />
        {/* Bottom-Left */}
        <rect x="222" y="507" width="24" height="24" rx="2" />
        {/* Bottom-Right */}
        <rect x="254" y="507" width="24" height="24" rx="2" />
      </g>
    </svg>
  );
};
