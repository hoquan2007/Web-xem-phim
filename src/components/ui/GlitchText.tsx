'use client';

import React from 'react';

interface GlitchTextProps {
  children: React.ReactNode;
  speed?: number;
  enableShadows?: boolean;
  enableOnHover?: boolean;
  className?: string;
  as?: React.ElementType;
}

export const GlitchText: React.FC<GlitchTextProps> = ({
  children,
  speed = 0.5,
  enableShadows = true,
  enableOnHover = false,
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
  const baseClass = enableOnHover ? 'glitch-text-effect glitch-text-hover' : 'glitch-text-effect';
  const combinedClasses = `${baseClass} ${className}`;

  return (
    <Component style={inlineStyles} data-text={textContent} className={combinedClasses}>
      {children}
    </Component>
  );
};

export default GlitchText;

