// Re-keyed on every navigation, so each route fades in (opacity only: a transform
// here would become the containing block for fixed-position children).
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="route-fade">{children}</div>;
}
