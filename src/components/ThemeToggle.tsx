import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { Switch } from "@/components/ui/switch";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <label className="flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1.5">
      <Sun className="size-4 text-gold" aria-hidden />
      <Switch
        checked={theme === "dark"}
        onCheckedChange={toggle}
        aria-label="Toggle dark mode"
      />
      <Moon className="size-4 text-muted-foreground" aria-hidden />
    </label>
  );
}
