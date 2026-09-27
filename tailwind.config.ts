import type { Config } from "tailwindcss";
const config: Config = { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"], theme: { extend: { colors: { ink: "#24312c", moss: "#315c49", cream: "#f8f5ed", lime: "#d9ef83", coral: "#ef866d" } } }, plugins: [] };
export default config;
