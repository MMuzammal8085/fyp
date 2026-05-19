type PanelProps = {
  children: React.ReactNode;
  className?: string;
};

export function Panel({ children, className = "" }: PanelProps) {
  return <div className={`app-panel ${className}`}>{children}</div>;
}

export function PanelTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <h2 className={`app-panel-title ${className}`}>{children}</h2>;
}

export function PanelMuted({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={`app-panel-muted ${className}`}>{children}</p>;
}
