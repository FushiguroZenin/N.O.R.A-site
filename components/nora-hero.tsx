"use client";

import { motion, useReducedMotion } from "framer-motion";

export function NoraHero() {
  const reduceMotion = useReducedMotion();
  const item = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 18 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <section className="hero hero-welcome">
      <motion.div
        className="hero-copy"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.11, delayChildren: 0.08 } } }}
      >
        <motion.h1 variants={item}>Sell the work. <span>Skip the pitch.</span></motion.h1>
        <motion.p variants={item}>Turn finished software into products people can discover, buy, and reuse.</motion.p>
        <motion.div className="hero-actions" variants={item}>
          <a href="/catalogue" className="primary-link">Explore the catalogue</a>
          <a href="/submit" className="text-link">Submit your work</a>
        </motion.div>
      </motion.div>
      <motion.div className="hero-art" aria-hidden="true" initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.24, ease: "easeOut" }}>
        <div className="art-ring">
          <motion.div className="art-crosshair" initial={{ opacity: 0, rotate: reduceMotion ? 0 : -100 }} animate={{ opacity: 1, rotate: 0 }} transition={{ duration: 0.85, delay: 0.42, ease: [0.22, 1, 0.36, 1] }} />
          <span>N</span>
        </div>
        <p>Built once.<br />Useful again.</p>
      </motion.div>
    </section>
  );
}
