import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        shopeasy: {
          indigo: '#4F46E5',
          'indigo-dark': '#4338CA',
        },
      },
    },
  },
  plugins: [],
};

export default config;
