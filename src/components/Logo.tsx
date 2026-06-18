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
          className="absolute right-[-3.5rem] bottom-[-0.3rem] flex items-end gap-1 text-[9px] uppercase tracking-[0.12em] text-muted-foreground whitespace-nowrap"
          aria-label="By Humanai"
        >
          <span className="font-semibold">By</span>
          <span className="font-semibold">HUMANAI</span>
        </span>
      )}
    </div>
  );
}
