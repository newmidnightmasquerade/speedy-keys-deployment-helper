import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function PrimaryButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "h-12 w-full rounded-full bg-primary text-[17px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-50",
        className,
      )}
    />
  );
}