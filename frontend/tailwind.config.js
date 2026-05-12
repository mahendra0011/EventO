/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff2ec',
          100: '#ffe2d5',
          200: '#ffc2a8',
          300: '#ff9a72',
          400: '#fb7047',
          500: '#f45a2c',
          600: '#e33f1a',
          700: '#bd2f15',
          800: '#982918',
          900: '#7b2619',
        },
        secondary: {
          50: '#fff1f3',
          100: '#ffe0e6',
          200: '#ffc6d3',
          300: '#ff97ad',
          400: '#ff6385',
          500: '#f43f67',
          600: '#df254f',
          700: '#bc1a40',
          800: '#9d193b',
          900: '#861936',
        },
        cocoa: {
          50: '#faf7f2',
          100: '#f4eee6',
          200: '#e6d8ca',
          300: '#d2bdaa',
          400: '#b6937c',
          500: '#976f59',
          600: '#76523f',
          700: '#583d2f',
          800: '#493225',
          900: '#3a271d',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-down': 'fadeInDown 0.6s ease-out',
        'slide-in-left': 'slideInLeft 0.6s ease-out',
        'slide-in-right': 'slideInRight 0.6s ease-out',
        'bounce-in': 'bounceIn 0.8s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'scale-in': 'scaleIn 0.3s ease-out',
        'rotate-in': 'rotateIn 0.6s ease-out',
        'swing': 'swing 1s ease-in-out infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-50px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(50px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(14, 165, 233, 0.5), 0 0 10px rgba(14, 165, 233, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(14, 165, 233, 0.8), 0 0 30px rgba(14, 165, 233, 0.5)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        rotateIn: {
          '0%': { opacity: '0', transform: 'rotate(-200deg)' },
          '100%': { opacity: '1', transform: 'rotate(0)' },
        },
        swing: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(15deg)' },
          '75%': { transform: 'rotate(-15deg)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.1)' },
          '50%': { transform: 'scale(1)' },
          '75%': { transform: 'scale(1.1)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'shimmer': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
      },
    },
  },
  safelist: [
    // Gradients for Why Choose section
    'from-blue-400', 'to-blue-600',
    'from-green-400', 'to-emerald-600',
    'from-purple-400', 'to-purple-600',
    'from-pink-400', 'to-rose-600',
    'from-orange-400', 'to-amber-600',
    'from-teal-400', 'to-cyan-600',
    'from-red-400', 'to-rose-600',
    'from-yellow-400', 'to-orange-500',
    // Gradients for Categories
    'from-rose-400', 'to-pink-500',
    'from-purple-400', 'to-indigo-500',
    'from-blue-400', 'to-cyan-500',
    'from-amber-400', 'to-orange-500',
    'from-green-400', 'to-emerald-500',
    // Shadow classes
    'hover:shadow-rose-200', 'hover:shadow-purple-200', 'hover:shadow-blue-200',
    'hover:shadow-pink-200', 'hover:shadow-amber-200', 'hover:shadow-green-200',
  ],
  plugins: [],
}
