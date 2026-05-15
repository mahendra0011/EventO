import { Fragment, useEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import './ScrollFloat.css';

gsap.registerPlugin(ScrollTrigger);

const ScrollFloat = ({
  children,
  scrollContainerRef,
  containerClassName = '',
  textClassName = '',
  animationDuration = 1,
  ease = 'back.inOut(2)',
  scrollStart = 'center bottom+=50%',
  scrollEnd = 'bottom bottom-=40%',
  stagger = 0.03
}) => {
  const containerRef = useRef(null);

  const splitText = useMemo(() => {
    if (typeof children !== 'string') return children;

    const words = children.split(' ');

    return words.map((word, wordIndex) => (
      <Fragment key={`${word}-${wordIndex}`}>
        <span className="scroll-float-word">
          {word.split('').map((char, charIndex) => (
            <span className="scroll-float-char" key={`${char}-${wordIndex}-${charIndex}`}>
              {char}
            </span>
          ))}
        </span>
        {wordIndex < words.length - 1 ? ' ' : null}
      </Fragment>
    ));
  }, [children]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const scroller = scrollContainerRef?.current || window;
    const charElements = el.querySelectorAll('.scroll-float-char');
    if (!charElements.length) return undefined;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        charElements,
        {
          willChange: 'opacity, transform',
          opacity: 0,
          yPercent: 120,
          scaleY: 2.3,
          scaleX: 0.7,
          transformOrigin: '50% 0%'
        },
        {
          duration: animationDuration,
          ease,
          opacity: 1,
          yPercent: 0,
          scaleY: 1,
          scaleX: 1,
          stagger,
          scrollTrigger: {
            trigger: el,
            scroller,
            start: scrollStart,
            end: scrollEnd,
            scrub: true
          }
        }
      );
    }, el);

    return () => ctx.revert();
  }, [scrollContainerRef, animationDuration, ease, scrollStart, scrollEnd, stagger]);

  return (
    <h2 ref={containerRef} className={`scroll-float ${containerClassName}`}>
      <span className={`scroll-float-text ${textClassName}`}>{splitText}</span>
    </h2>
  );
};

export default ScrollFloat;
