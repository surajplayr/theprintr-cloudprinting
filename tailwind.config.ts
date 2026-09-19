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
        cotton: '#EDEBDE',
        cherry: '#810100',
        maroon: '#630102',
        noir: '#1B1716',
      },
    },
  },
  plugins: [],
};
export default config;
