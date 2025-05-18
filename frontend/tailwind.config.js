/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2c3e50',
          light: '#34495e',
          dark: '#1a252f',
        },
        secondary: {
          DEFAULT: '#95a5a6',
          light: '#b3b3b3',
          dark: '#7f8c8d',
        },
        success: {
          DEFAULT: '#27ae60',
          light: '#2ecc71',
          dark: '#219a52',
        },
        warning: {
          DEFAULT: '#f39c12',
          light: '#f1c40f',
          dark: '#d35400',
        },
        danger: {
          DEFAULT: '#e74c3c',
          light: '#c0392b',
          dark: '#c0392b',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      borderRadius: {
        'lg': '0.5rem',
        'xl': '1rem',
      },
      boxShadow: {
        'card': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 6px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 