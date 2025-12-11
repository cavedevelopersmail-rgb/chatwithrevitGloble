import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // Import the React plugin
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(), // <--- Essential for your React code to work
    tailwindcss(),
  ],
});
