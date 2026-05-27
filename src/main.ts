import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

// Importación global del Sistema de Diseño (KDE Plasma Breeze)
import './styles/main.css';

const app = createApp(App);

// Inicialización de la gestión de estado (Pinia)
app.use(createPinia());

// Montaje en el DOM
app.mount('#app');
