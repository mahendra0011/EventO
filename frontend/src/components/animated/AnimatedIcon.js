import React from 'react';
import { motion } from 'framer-motion';

const AnimatedIcon = ({ 
  children, 
  variant = 'default',
  className = '',
  delay = 0,
  ...props 
}) => {
  const variants = {
    default: {
      whileHover: { scale: 1.2, rotate: 10 },
      whileTap: { scale: 0.9 },
    },
    bounce: {
      whileHover: { scale: 1.3, y: -5 },
      whileTap: { scale: 0.8 },
    },
    spin: {
      whileHover: { rotate: 360 },
      whileTap: { scale: 0.9 },
    },
    pulse: {
      whileHover: { scale: [1, 1.2, 1] },
      whileTap: { scale: 0.9 },
    },
    shake: {
      whileHover: { x: [-5, 5, -5, 5, 0] },
      whileTap: { scale: 0.9 },
    },
    float: {
      animate: { y: [0, -10, 0] },
      transition: { duration: 2, repeat: Infinity },
    },
  };

  const selectedVariant = variants[variant] || variants.default;

  return (
    <motion.div
      className={`inline-flex items-center justify-center ${className}`}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay,
        type: 'spring',
        stiffness: 260,
        damping: 20
      }}
      {...selectedVariant}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedIcon;
