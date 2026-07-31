'use client';

import React from 'react';

interface GlitchTextProps {
  children: React.ReactNode;
  speed?: number;
  enableShadows?: boolean;
  enableOnHover?: boolean;
  /**
   * FIX-9.2.2: nếu true, animation chạy liên tục (mặc định CSS behavior).
   * Mặc định false — chỉ chạy khi hover (class `.glitch-text-hover`).
   * Dùng `false` cho logo Footer/thanh nav để tiết kiệm CPU khi user không tương tác.
   */
  alwaysOn?: boolean;
  className?: string;
  as?: React.ElementType;
}

export const GlitchText: React.FC<GlitchTextProps> = ({
  children,
  speed = 0.5,
  enableShadows = true,
  enableOnHover = false,
  alwaysOn = false,
  className = '',
  as: Component = 'div',
}) => {
  const inlineStyles: React.CSSProperties & { [key: string]: string } = {
    '--after-duration': `${speed * 3}s`,
    '--before-duration': `${speed * 2}s`,
    '--after-shadow': enableShadows ? '-2px 0 #ef4444' : 'none',
    '--before-shadow': enableShadows ? '2px 0 #06b6d4' : 'none',
  };

  const textContent = typeof children === 'string' ? children : String(children);
  // FIX-9.2.2: ưu tiên `alwaysOn` > `enableOnHover`. Khi alwaysOn=true → chỉ dùng
  // `.glitch-text-effect` (CSS sẽ chạy animation mặc định). Khi false → dùng
  // `.glitch-text-hover` để pause mặc định, chỉ chạy khi hover.
  const baseClass = alwaysOn
    ? 'glitch-text-effect'
    : enableOnHover
      ? 'glitch-text-effect glitch-text-hover'
      : 'glitch-text-effect';
  const combinedClasses = `${baseClass} ${className}`;

  return (
    <Component style={inlineStyles} data-text={textContent} className={combinedClasses}>
      {children}
    </Component>
  );
};

export default GlitchText;

