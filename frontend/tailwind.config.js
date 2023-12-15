/** @type {import('tailwindcss').Config} */
import forumPlugin from '@tailwindcss/forms'
export default {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {},
  },
  plugins: [forumPlugin],
}

