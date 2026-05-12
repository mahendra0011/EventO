import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PageTransition = ({ children, className = '' }) => {
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 18,
      scale: 0.992,
      filter: 'blur(8px)',
    },
    in: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
    },
    out: {
      opacity: 0,
      y: -14,
      scale: 0.998,
      filter: 'blur(6px)',
    },
  };

  const pageTransition = {
    type: 'spring',
    stiffness: 120,
    damping: 22,
    mass: 0.6,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className={className}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;
