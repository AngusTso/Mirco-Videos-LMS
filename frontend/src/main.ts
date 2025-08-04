// src/main.ts
import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import App from "./App.vue";
import "./style.css"; // Assuming Tailwind CSS is imported here
import "@fortawesome/fontawesome-free/css/all.min.css";

// Create the Vue app
const app = createApp(App);

// Initialize Pinia
const pinia = createPinia();

// Use Pinia and Router
app.use(pinia);
app.use(router);

// Mount the app
app.mount("#app");
