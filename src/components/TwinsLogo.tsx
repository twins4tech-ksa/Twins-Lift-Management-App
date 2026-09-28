import React, { useState } from 'react';

interface TwinsLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  showText?: boolean;
  customLogoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}

export const TwinsLogo: React.FC<TwinsLogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
  customLogoUrl,
  primaryColor,
  accentColor,
}) => {
  const [imageError, setImageError] = useState(false);

  let pixelSize = 40;
  if (typeof size === 'number') {
    pixelSize = size;
  } else {
    switch (size) {
      case 'xs':
        pixelSize = 28;
        break;
      case 'sm':
        pixelSize = 36;
        break;
      case 'md':
        pixelSize = 44;
        break;
      case 'lg':
        pixelSize = 64;
        break;
      case 'xl':
        pixelSize = 96;
        break;
    }
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div 
        className="relative rounded-full overflow-hidden shrink-0 border border-amber-500/40 shadow-sm bg-black flex items-center justify-center"
        style={{ width: `${pixelSize}px`, height: `${pixelSize}px` }}
      >
        {customLogoUrl ? (
          <img
            src={customLogoUrl}
            alt="Company Logo"
            className="w-full h-full object-contain p-0.5 rounded-full"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
          />
        ) : !imageError ? (
          <img
            src="/twins_logo.png"
            alt="Twins Lift Calc / Twins Technology Logo"
            className="w-full h-full object-cover rounded-full"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
          />
        ) : (
          /* High quality vector fallback matching the Twins Technology emblem */
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Black circular background */}
            <circle cx="100" cy="100" r="100" fill="#000000" />
            
            {/* Blue and Gold Geometric Diamond Motif Top */}
            <path
              d="M100 28 L115 43 L100 58 L85 43 Z"
              stroke="#E5A919"
              strokeWidth="4"
              fill="none"
            />
            <path
              d="M93 35 L107 49 L93 63 L79 49 Z"
              stroke="#1E40AF"
              strokeWidth="3"
              fill="none"
            />

            {/* TWINS Letters Background */}
            <text
              x="36"
              y="98"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="48"
              fontWeight="900"
              fill="#0F2445"
            >
              T
            </text>
            <text
              x="115"
              y="98"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="48"
              fontWeight="900"
              fill="#0F2445"
            >
              INS
            </text>

            {/* Central Gold Architectural Geometric Lines */}
            <g stroke="#E5A919" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M72 75 L100 55 L128 75" />
              <path d="M78 84 L100 68 L122 84" />
              <path d="M84 93 L100 81 L116 93" />
              <path d="M74 78 L74 105" />
              <path d="M126 78 L126 105" />
              <path d="M100 55 L100 105" />
              <rect x="94" y="96" width="12" height="10" stroke="#0F2445" fill="#0F2445" />
            </g>

            {/* TECHNOLOGY Gold Typography */}
            <text
              x="100"
              y="132"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="23"
              fontWeight="900"
              fill="#F5B800"
              letterSpacing="2"
            >
              TECHNOLOGY
            </text>

            {/* Arabic Calligraphy Subtitle */}
            <text
              x="100"
              y="158"
              textAnchor="middle"
              fontFamily="'Segoe UI', Tahoma, sans-serif"
              fontSize="14"
              fontWeight="700"
              fill="#1D4ED8"
            >
              شركة توينز تكنولوجي
            </text>
          </svg>
        )}
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-extrabold text-sm tracking-tight text-white leading-none">
            TWINS LIFT CALC
          </span>
          <span className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase mt-0.5">
            Twins Technology
          </span>
        </div>
      )}
    </div>
  );
};
