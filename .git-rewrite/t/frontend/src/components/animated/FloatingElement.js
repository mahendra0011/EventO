import React from 'react';
import { motion } from 'framer-motion';

const FloatingElement = ({ 
  children, 
  className = '',
  duration = 3,
  delay = 0,
  y = 20,
  ...props 
}) => {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -y, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default FloatingElement;
