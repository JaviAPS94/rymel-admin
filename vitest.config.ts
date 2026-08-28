import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@store": path.resolve(__dirname, "./src/store"),
      "@utils": path.resolve(__dirname, "./src/utils"),
    },
  },
  test: {
    // `node` por omisión: casi todo lo que se prueba son funciones puras. Los
    // ficheros que montan un hook piden `jsdom` con una anotación propia.
    environment: "node",
    include: ["src/**/*.spec.{ts,tsx}"],
    // Necesario para que Testing Library limpie el DOM entre pruebas: sin
    // esto, lo que monta una prueba sigue ahí en la siguiente y los selectores
    // encuentran dos de todo.
    globals: true,
  },
});
