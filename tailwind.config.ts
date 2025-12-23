import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#111827', // gray-900
            a: {
              color: '#2563eb', // blue-600
              '&:hover': {
                color: '#1d4ed8', // blue-700
              },
            },
            strong: {
              color: '#111827', // gray-900
            },
            h1: {
              color: '#111827', // gray-900
            },
            h2: {
              color: '#111827', // gray-900
            },
            h3: {
              color: '#111827', // gray-900
            },
            h4: {
              color: '#111827', // gray-900
            },
            code: {
              color: '#111827', // gray-900
            },
            blockquote: {
              color: '#374151', // gray-700
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
export default config;
