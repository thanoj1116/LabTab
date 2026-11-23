import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--bg-canvas)",
        surface: {
          1: "var(--surface-1)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
        border: {
          subtle: "var(--border-subtle)",
          hover: "var(--border-hover)",
        },
        primary: {
          DEFAULT: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          text: "var(--accent-text)",
        },
        status: {
          approved: "var(--status-approved)",
          "approved-bg": "var(--status-approved-bg)",
          pending: "var(--status-pending)",
          "pending-bg": "var(--status-pending-bg)",
          rejected: "var(--status-rejected)",
          "rejected-bg": "var(--status-rejected-bg)",
          cancelled: "var(--status-cancelled)",
          "cancelled-bg": "var(--status-cancelled-bg)",
        },
      },
      borderRadius: {
        tile: "12px",
        control: "8px",
      },
    },
  },
  plugins: [],
};
export default config;
