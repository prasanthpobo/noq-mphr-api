import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // NoQ Doctor Design System
        primary: {
          dark: '#102E63',   // page background, sidebar
          DEFAULT: '#1E4FA3', // buttons, active states
        },
        teal: '#1FA3A8',     // CTA buttons, badges
        'light-blue': '#9BB4DD', // secondary text, inactive icons
        surface: '#E8F1FD',  // card backgrounds, input fills
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(16, 46, 99, 0.08)',
        modal: '0 8px 40px rgba(16, 46, 99, 0.16)',
      },
    },
  },
  plugins: [],
} satisfies Config
