"use client";
import { useLayoutEffect, useEffect, useRef } from "react";
import type { MotionValue } from "motion";

export const CARD_HEIGHT = 280;
export const CARD_PEEK = 100;

type MotionModule = typeof import("./wallet-motion-library");
interface CardPose {
  y: number;
  scale: number;
  opacity: number;
}
type CardValues = { [Key in keyof CardPose]: MotionValue<number> };

// Physical springs, tuned to the previous hand-written curves: opening
// settles in about 0.6s with a small overshoot, closing in about 0.5s. A
// spring keeps the card's velocity when a tap interrupts it mid-flight.
const OPEN_SPRING = { type: "spring", stiffness: 440, damping: 26 } as const;
const CLOSE_SPRING = { type: "spring", stiffness: 700, damping: 33 } as const;
const REST_DELTA: CardPose = { y: 0.5, scale: 0.001, opacity: 0.01 };

// Motion is loaded with the Wallet, not with every page. Until it arrives
// (or if it fails to load), cards move to their pose without animating.
let motionModule: Promise<MotionModule> | null = null;
const loadMotion = () => (motionModule ??= import("./wallet-motion-library"));

function applyPose(node: HTMLElement, pose: CardPose) {
  node.style.transform = `translate3d(0,${pose.y}px,0) scale(${pose.scale})`;
  // Springs overshoot; opacity must stay within 0–1.
  node.style.opacity = String(Math.min(1, Math.max(0, pose.opacity)));
}

function renderedPose(node: HTMLElement): CardPose {
  const style = getComputedStyle(node);
  const matrix = new DOMMatrix(
    style.transform === "none" ? undefined : style.transform,
  );
  return { y: matrix.m42, scale: matrix.a, opacity: Number(style.opacity) };
}

/** Owns only transforms/opacity. React owns selection, visibility and focus. */
export function useWalletMotion(
  selected: string | null,
  ids: string[],
  rebound = 0,
) {
  const cards = useRef(new Map<string, HTMLButtonElement>());
  const values = useRef(new Map<string, CardValues>());
  const initialized = useRef(new Set<string>());
  const motion = useRef<MotionModule | null>(null);
  const key = ids.join("|");

  useEffect(() => {
    let mounted = true;
    loadMotion().then(
      (module) => {
        if (mounted) motion.current = module;
      },
      () => {
        // Without the library the Wallet still works; cards just jump.
        motionModule = null;
      },
    );
    const cardValues = values.current;
    return () => {
      mounted = false;
      cardValues.forEach((card) =>
        Object.values(card).forEach((value) => value.destroy()),
      );
      cardValues.clear();
    };
  }, []);

  useLayoutEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const library = motion.current;
    cards.current.forEach((node, id) => {
      const index = ids.indexOf(id);
      const isSelected = selected === id;
      const target: CardPose = {
        y: selected
          ? isSelected
            ? 0
            : CARD_HEIGHT + 150 + index * 24
          : index * CARD_PEEK,
        scale: selected ? (isSelected ? 1 : 0.94) : 1,
        opacity: selected && !isSelected ? 0 : 1,
      };
      node.style.zIndex = String(isSelected ? 10 : index + 1);
      const existing = values.current.get(id);
      if (!library || reduced || !initialized.current.has(id)) {
        existing?.y.stop();
        existing?.scale.stop();
        existing?.opacity.stop();
        applyPose(node, target);
        initialized.current.add(id);
        return;
      }
      const card = existing ?? createValues(library, id, renderedPose(node));
      // A card at rest may have been moved by the drag gesture: start from
      // where it is drawn. A card in flight keeps its value and velocity.
      if (!card.y.isAnimating()) {
        const drawn = renderedPose(node);
        card.y.jump(drawn.y);
        card.scale.jump(drawn.scale);
        card.opacity.jump(drawn.opacity);
      }
      const spring = selected ? OPEN_SPRING : CLOSE_SPRING;
      (Object.keys(target) as (keyof CardPose)[]).forEach((property) =>
        library.animate(card[property], target[property], {
          ...spring,
          restDelta: REST_DELTA[property],
        }),
      );
    });

    function createValues(
      library: MotionModule,
      id: string,
      from: CardPose,
    ): CardValues {
      const card: CardValues = {
        y: library.motionValue(from.y),
        scale: library.motionValue(from.scale),
        opacity: library.motionValue(from.opacity),
      };
      const render = () => {
        const node = cards.current.get(id);
        if (node)
          applyPose(node, {
            y: card.y.get(),
            scale: card.scale.get(),
            opacity: card.opacity.get(),
          });
      };
      Object.values(card).forEach((value) => value.on("change", render));
      values.current.set(id, card);
      return card;
    }
    // The stable serialized ids express the deck membership/order dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, key, rebound]);

  return cards;
}
