import React from "react";
interface Props {
  children: React.ReactNode;
  speed?: number;
  enableShadows?: boolean;
  enableOnHover?: boolean;
  alwaysOn?: boolean;
  className?: string;
  as?: React.ElementType;
}
export default function GlitchText({
  children,
  className,
  as: Component = "span",
}: Props) {
  return <Component className={className}>{children}</Component>;
}
export { GlitchText };
