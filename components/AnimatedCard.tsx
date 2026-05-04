interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function AnimatedCard({ children, className = "", style }: AnimatedCardProps) {
  return (
    <div
      className={`transition-all duration-300 ease-out hover:scale-105 ${className}`}
      style={{
        ...style,
        transformOrigin: "center",
      }}
    >
      {children}
    </div>
  );
}
