interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export default function Logo({ size = "md", showText = true }: LogoProps) {
  const sizes = {
    sm: { box: "w-7 h-7", icon: "w-4 h-4", text: "text-base" },
    md: { box: "w-9 h-9", icon: "w-5 h-5", text: "text-xl" },
    lg: { box: "w-12 h-12", icon: "w-7 h-7", text: "text-2xl" },
  };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${s.box} bg-primary rounded-xl flex items-center justify-center`}>
        <svg className={`${s.icon} text-white`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4L19 7" />
        </svg>
      </div>
      {showText && (
        <span className={`${s.text} font-bold tracking-tight`}>
          <span className="text-text-primary">Price</span>
          <span className="text-primary">Compare</span>
        </span>
      )}
    </div>
  );
}
