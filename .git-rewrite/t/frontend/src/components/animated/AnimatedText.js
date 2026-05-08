import React from 'react';
import { motion } from 'framer-motion';

const AnimatedText = ({ 
  children, 
  variant = 'default',
  className = '',
  delay = 0,
  ...props 
}) => {
  const variants = {
    default: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
    },
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
    },
    slideUp: {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 },
    },
    slideDown: {
      initial: { opacity: 0, y: -50 },
      animate: { opacity: 1, y: 0 },
    },
    slideLeft: {
      initial: { opacity: 0, x: 50 },
      animate: { opacity: 1, x: 0 },
    },
    slideRight: {
      initial: { opacity: 0, x: -50 },
      animate: { opacity: 1, x: 0 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
    },
    bounce: {
      initial: { opacity: 0, scale: 0.3 },
      animate: { opacity: 1, scale: 1 },
    },
  };

  const selectedVariant = variants[variant] || variants.default;

  return (
    <motion.div
      className={className}
      initial={selectedVariant.initial}
      animate={selectedVariant.animate}
      transition={{ 
        duration: 0.6, 
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const AnimatedHeading = ({ 
  children, 
  level = 1, 
  className = '',
  delay = 0,
  ...props 
}) => {
  const Tag = `h${level}`;
  
  return (
    <AnimatedText variant="slideUp" delay={delay} className={className} {...props}>
      <Tag>{children}</Tag>
    </AnimatedText>
  );
};

export const AnimatedParagraph = ({ 
  children, 
  className = '',
  delay = 0,
  ...props 
}) => {
  return (
    <AnimatedText variant="fadeIn" delay={delay} className={className} {...props}>
      <p>{children}</p>
    </AnimatedText>
  );
};

export default AnimatedText;
