/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        surface: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          900: '#080d1a',
          800: '#0d1529',
          700: '#131e38',
          600: '#1a2849',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
        },
        aqi: {
          good: '#00E400',
          moderate: '#FFFF00',
          sensitive: '#FF7E00',
          unhealthy: '#FF0000',
          very: '#8F3F97',
          hazardous: '#7E0023',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(34,211,238,0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(34,211,238,0.8)' },
        },
      },
    },
  },
  plugins: [],
}
