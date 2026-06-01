import React, { useEffect, useRef, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';

export const hasGoogleClientId = Boolean(process.env.REACT_APP_GOOGLE_CLIENT_ID);

const GoogleAuthButton = ({ disabled = false, onCredential, onError, text = 'continue_with' }) => {
  const containerRef = useRef(null);
  const [buttonWidth, setButtonWidth] = useState(320);

  useEffect(() => {
    if (!hasGoogleClientId || !containerRef.current) return undefined;

    const updateWidth = () => {
      const width = containerRef.current?.getBoundingClientRect().width || 320;
      setButtonWidth(Math.max(200, Math.min(400, Math.floor(width))));
    };

    updateWidth();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!hasGoogleClientId) return null;

  return (
    <div ref={containerRef} className={`w-full ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          if (credentialResponse.credential) {
            onCredential(credentialResponse.credential);
          } else {
            onError?.();
          }
        }}
        onError={() => onError?.()}
        theme="filled_black"
        size="medium"
        shape="pill"
        text={text}
        logo_alignment="left"
        width={buttonWidth}
      />
    </div>
  );
};

export default GoogleAuthButton;
