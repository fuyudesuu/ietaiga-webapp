"use client";
import { useLayoutEffect, useEffect, useRef } from "react";

export const CARD_HEIGHT = 280;
export const CARD_PEEK = 100;
const spring = Array.from({ length: 46 }, (_, i) => {
  const t = i / 45;
  return i === 45
    ? 1
    : 1 - Math.exp(-8 * t) * (Math.cos(10 * t) + 0.8 * Math.sin(10 * t));
});

/** Owns only transforms/opacity. React owns selection, visibility and focus. */
export function useWalletMotion(
  selected: string | null,
  ids: string[],
  rebound = 0,
) {
  const cards = useRef(new Map<string, HTMLButtonElement>());
  const animations = useRef(new Map<string, Animation>());
  const initialized = useRef(new Set<string>());
  const key = ids.join("|");
  useLayoutEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    cards.current.forEach((node, id) => {
      const index = ids.indexOf(id);
      const current = getComputedStyle(node);
      const matrix = new DOMMatrix(
        current.transform === "none" ? undefined : current.transform,
      );
      const from = {
        y: matrix.m42,
        scale: matrix.a,
        opacity: Number(current.opacity),
      };
      animations.current.get(id)?.cancel();
      const isSelected = selected === id;
      const to = {
        y: selected
          ? isSelected
            ? 0
            : CARD_HEIGHT + 150 + index * 24
          : index * CARD_PEEK,
        scale: selected ? (isSelected ? 1 : 0.94) : 1,
        opacity: selected && !isSelected ? 0 : 1,
      };
      node.style.transform = `translate3d(0,${to.y}px,0) scale(${to.scale})`;
      node.style.opacity = String(to.opacity);
      node.style.zIndex = String(isSelected ? 10 : index + 1);
      if (initialized.current.has(id) && !reduced && node.animate) {
        const animation = node.animate(
          spring.map((p, i) => ({
            transform: `translate3d(0,${from.y + (to.y - from.y) * p}px,0) scale(${from.scale + (to.scale - from.scale) * p})`,
            opacity:
              from.opacity +
              (to.opacity - from.opacity) * Math.min(1, Math.max(0, p)),
            offset: i / 45,
          })),
          { duration: selected ? 610 : 480, easing: "linear" },
        );
        animations.current.set(id, animation);
      }
      initialized.current.add(id);
    });
    // The stable serialized ids express the deck membership/order dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, key, rebound]);
  useEffect(() => {
    const activeAnimations = animations.current;
    return () => activeAnimations.forEach((animation) => animation.cancel());
  }, []);
  return cards;
}
