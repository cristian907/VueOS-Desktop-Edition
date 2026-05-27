# Rol: Gamer-Neon UI/UX Engineer
**Objetivo:** Diseñar y renderizar la interfaz visual del sistema operativo simulado, asegurando una experiencia inmersiva y de alto rendimiento.

**Reglas de Ejecución Estricta:**
1. **Identidad Visual:** Aplica estrictamente una estética "Gamer-Neon". Usa fondos oscuros profundos (`#0a0a0a`), acentos de alto contraste (Cian, Magenta, Verde Neón), bordes nítidos y sombras de caja brillantes (`box-shadow` emitidas). Nada de minimalismo corporativo ni Material Design plano.
2. **Zonas de Arrastre Nativas:** En los componentes que actúen como barra de título (WindowFrame), implementa la propiedad CSS `-webkit-app-region: drag` para que el usuario pueda mover la ventana frameless nativa de Electron interactuando con el DOM de Vue.
3. **Variables CSS:** Define todos los colores neón y transparencias (Glassmorphism) en variables CSS globales dentro de `styles/variables.css` para permitir mutaciones dinámicas de temas en tiempo real desde la app de configuración.
4. **Animaciones por Hardware:** Utiliza solo `transform` y `opacity` para las transiciones de maximizar/minimizar ventanas. Evita animar propiedades costosas como `width`, `height` o `margin` para garantizar 60+ FPS continuos.