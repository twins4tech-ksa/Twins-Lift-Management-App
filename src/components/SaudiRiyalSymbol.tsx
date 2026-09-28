import React from 'react';

/**
 * Official Saudi Riyal Symbol (رمز الريال السعودي الجديد)
 * Approved by the Saudi Central Bank (SAMA) and designated Unicode U+20C1 (⃁).
 * Rendered using the official SAMA vector geometry for 100% crisp cross-browser fidelity.
 */
export const SAUDI_RIYAL_UNICODE = '\u20C1'; // ⃁

interface SaudiRiyalSymbolProps {
  className?: string;
  size?: number | string;
  title?: string;
}

export const SaudiRiyalSymbol: React.FC<SaudiRiyalSymbolProps> = ({
  className = 'w-3.5 h-3.5 inline-block align-baseline',
  size,
  title = 'الريال السعودي (⃁)',
}) => {
  return (
    <svg
      viewBox="0 0 1124.14 1256.39"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="رمز الريال السعودي (⃁)"
      role="img"
    >
      <title>{title}</title>
      <path d="M699.62 1113.02c-20.06 44.48-33.32 92.75-38.4 143.37l424.51-90.24c20.06-44.47 33.31-92.75 38.4-143.37zm386.11-217.22c20.06-44.47 33.32-92.75 38.4-143.37l-330.68 70.33v-135.2l292.27-62.11c20.06-44.47 33.32-92.75 38.4-143.37l-330.68 70.27V66.13c-50.67 28.45-95.67 66.32-132.25 110.99v403.35l-132.25 28.11V0c-50.67 28.44-95.67 66.32-132.25 110.99v525.69l-295.91 62.88c-20.06 44.47-33.33 92.75-38.42 143.37l334.33-71.05v170.26l-358.3 76.14c-20.06 44.47-33.32 92.75-38.4 143.37l375.04-79.7c30.53-6.35 56.77-24.4 73.83-49.24l68.78-101.97v-.02c7.14-10.55 11.3-23.27 11.3-36.97V743.77l132.25-28.11v270.4l424.53-90.28Z" />
    </svg>
  );
};

interface SarPriceProps {
  amount: number;
  className?: string;
  symbolClassName?: string;
  showCode?: boolean;
  symbolPosition?: 'prefix' | 'suffix';
}

export const SarPrice: React.FC<SarPriceProps> = ({
  amount,
  className = '',
  symbolClassName = 'w-[0.85em] h-[0.85em] inline-block align-baseline mr-1 shrink-0',
  showCode = false,
  symbolPosition = 'prefix',
}) => {
  const formatted = Math.round(amount).toLocaleString();

  return (
    <span className={`currency-price inline-flex items-baseline font-mono ${className}`}>
      {symbolPosition === 'prefix' && (
        <SaudiRiyalSymbol className={symbolClassName} />
      )}
      <span>{formatted}</span>
      {symbolPosition === 'suffix' && (
        <SaudiRiyalSymbol className={`ml-1 ${symbolClassName}`} />
      )}
      {showCode && (
        <span className="text-[0.75em] font-sans font-semibold text-slate-500 mx-1.5 self-center">
          SAR
        </span>
      )}
    </span>
  );
};

/**
 * Formats amount into string with the official Saudi Riyal symbol (⃁)
 */
export function formatSarString(amount: number, options?: { includeCode?: boolean }): string {
  const formatted = Math.round(amount).toLocaleString();
  return options?.includeCode ? `${SAUDI_RIYAL_UNICODE} ${formatted} SAR` : `${SAUDI_RIYAL_UNICODE} ${formatted}`;
}
