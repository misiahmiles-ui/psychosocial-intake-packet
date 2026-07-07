import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#182321",
        sea: "#0f766e",
        mint: "#dff7ef",
        clay: "#c05636",
        linen: "#f7f3ea",
        cloud: "#f5f7f7"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(24, 35, 33, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
