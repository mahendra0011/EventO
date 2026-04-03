import React from 'react';
import { motion } from 'framer-motion';

const ShimmerEffect = ({ 
  children, 
  className = '',
  ...props 
}) => {
  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      {children}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </motion.div>
  );
};

export default ShimmerEffect;
