import wasl from "@/assets/wasl-logo.png";
import humanai from "@/assets/humanai-logo.png";

export function Logo({
  variant = "wasl",
  className = "h-8",
  showByline = true,
}: {
  variant?: "wasl" | "humanai";
  className?: string;
  showByline?: boolean;
}) {
  if (variant === "humanai") {
    return <img src={humanai} alt="Humanai" className={`${className} w-auto object-contain`} />;
  }
  return (
    <div className="relative inline-block leading-none">
      <img src={wasl} alt="Wasl" className={`${className} w-auto object-contain block`} />
      {showByline && (
        <span
          className="absolute bottom-0 left-0 flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase text-muted-foreground whitespace-nowrap"
          aria-label="by Humanai"
        >
          <span className="font-medium">by</span>
          <img src={humanai} alt="Humanai" className="h-[11px] w-auto object-contain" />
        </span>
      )}
    </div>
  );
}
