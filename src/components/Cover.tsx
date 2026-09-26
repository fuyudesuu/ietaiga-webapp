import type { CSSProperties, ReactNode } from "react";
import styles from "./ui.module.css";

interface CoverProps {
  hue: number;
  className?: string;
  children?: ReactNode;
}

/** Generated gradient standing in for an uploaded cover image (prototype). */
export function Cover({ hue, className, children }: CoverProps) {
  return (
    <div className={`${styles.cover} ${className ?? ""}`} style={{ "--hue": hue } as CSSProperties}>
      {children}
    </div>
  );
}
