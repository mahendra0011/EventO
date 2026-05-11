import React from 'react';
import { motion } from 'framer-motion';

const AnimatedCard = ({ 
  children, 
  className = '', 
  hover = true,
  delay = 0,
  ...props 
}) => {
  return (
    <motion.div
      className={`overflow-hidden rounded-lg border border-white bg-white shadow-xl shadow-cocoa-900/5 ${className}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={hover ? { 
        y: -6,
        boxShadow: '0 24px 55px -24px rgba(58, 39, 29, 0.28)',
        transition: { duration: 0.3 }
      } : {}}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;
