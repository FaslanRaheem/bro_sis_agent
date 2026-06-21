// ============================================================
// src/lib/motion.ts
// Shared Framer Motion animation variants — typed correctly.
// ============================================================

import type { Variants } from "framer-motion";

/** Standard page/card entrance */
export const containerVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

/** Staggered field entrance — use `custom` prop for index */
export const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: "easeOut" },
  }),
};
