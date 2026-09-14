import logo from "@/assets/dollarcash-logo.png";

export function Logo({ size = 34, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <img
        src={logo}
        alt="DollarCash logo"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="shrink-0"
      />
      {withText ? (
        <span className="font-display text-lg font-bold leading-none">
          Dollar<span className="text-gold">Cash</span>
        </span>
      ) : null}
    </span>
  );
}
