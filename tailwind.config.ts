import type { Config } from "tailwindcss";
const config: Config = { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"], theme: { extend: { colors: { ink: "#142A42", navy: "#173E68", blue: "#2878D0", sky: "#A8D3FF", ice: "#EAF3FC", moss: "#356D9E", cream: "#F3F8FD", lime: "#CFE5FA", coral: "#2878D0", plum: "#173E68", paper: "#F3F8FD" } } }, plugins: [] };
export default config;
