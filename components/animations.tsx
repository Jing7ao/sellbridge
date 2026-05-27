"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

/** 页面入场 */
export function PageFadeIn({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={fadeIn}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}

/** 从下方淡入 */
export function FadeInUp({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

/** 子元素依次入场 */
export function StaggerChildren({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={stagger} initial="hidden" animate="visible">
      {children}
    </motion.div>
  );
}

/** 单个子元素（配合 StaggerChildren 使用） */
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={fadeInUp}>
      {children}
    </motion.div>
  );
}

/** 卡片悬浮效果 */
export function HoverCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -2, boxShadow: "0 8px 25px -5px rgba(0,0,0,0.08)" }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
