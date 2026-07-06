import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          primary:   "#FBFAF7",
          secondary: "#F0EFEC",
          tertiary:  "#E8E7E3",
        },
        text: {
          primary:   "#232323",
          secondary: "#505050",
          muted:     "#6E6E6E",
          "on-dark": "#FFFFFF",
        },
        action: {
          primary: "#232323",
        },
        sage: {
          dark:   "#003014",
          medium: "#C6E5C6",
          light:  "#D9EED9",
          pale:   "#EDF7ED",
        },
        tierra: {
          500: "#DACAB0",
          200: "#EEE7DB",
          100: "#F7F2E9",
          75:  "#F9F6EF",
        },
        border: {
          light: "#D9D9D9",
          warm:  "#EEE7DB",
          dark:  "#333333",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        "heading-lg": "-0.04em",
        "heading-md": "-0.02em",
        "heading-sm": "-0.01em",
        "body":       "-0.01em",
      },
      lineHeight: {
        "heading-lg": "1",
        "heading-md": "1.2",
        "body":       "1.4",
      },
    },
  },
  plugins: [],
};
export default config;
