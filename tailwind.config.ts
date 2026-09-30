import type { Config } from "tailwindcss";
const config: Config = { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"], theme: { extend: { colors: {
  ink: "#111827",
  secondary: "#6B7280",
  line: "#E5E7EB",
  primary: "#2563EB",
  "primary-hover": "#1D4ED8",
  "blue-light": "#EFF6FF",
  navy: "#1D4ED8",
  blue: "#2563EB",
  sky: "#2563EB",
  ice: "#EFF6FF",
  moss: "#6B7280",
  cream: "#F8FAFC",
  lime: "#E5E7EB",
  coral: "#2563EB",
  plum: "#1D4ED8",
  paper: "#F8FAFC",
} } }, plugins: [] };
export default config;
