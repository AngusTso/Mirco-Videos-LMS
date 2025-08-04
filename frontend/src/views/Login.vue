<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
      <h2 class="text-2xl font-bold text-center text-gray-800 mb-6">Login</h2>
      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <input
            v-model="email"
            type="email"
            class="w-full p-2 mt-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Email Address"
            required
          />
        </div>
        <div class="mb-6">
          <input
            v-model="password"
            type="password"
            class="w-full p-2 mt-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Password"
            required
          />
        </div>
        <button
          type="submit"
          class="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          LOG IN
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../store";
import axios from "axios";
import DOMPurify from "dompurify";

const email = ref<string>("");
const password = ref<string>("");
const error = ref<string | null>(null);
const isLoading = ref<boolean>(false);
const router = useRouter();
const authStore = useAuthStore();
// const authStore = useAuthStore();

const handleLogin = async () => {
  // Reset error state
  error.value = null;
  isLoading.value = true;

  try {
    const sanitizedEmail = DOMPurify.sanitize(email.value.trim());
    const sanitizedPassword = DOMPurify.sanitize(password.value);

    const response = await axios.post("http://localhost:3000/api/auth/login", {
      email: sanitizedEmail,
      password: sanitizedPassword,
    });
    console.log(response);
    // Extract token and user role from response
    const { token } = response.data;
    const decodedToken = JSON.parse(atob(token.split(".")[1])); // Decode JWT payload
    const role = decodedToken.role;

    // Store token and user data in auth store
    authStore.setAuthData(token, decodedToken.id, role);

    // Redirect based on role
    switch (role) {
      case "Admin":
        router.push("/dashboard");
        break;
      case "Teacher":
        router.push("/dashboard");
        break;
      case "Student":
        router.push("/dashboard");
        break;
      default:
        error.value = "Invalid user role";
    }
  } catch (err: any) {
    // Handle errors from API
    if (err.response) {
      error.value =
        err.response.data.message || "Login failed. Please try again.";
    } else {
      error.value = "An unexpected error occurred. Please try again later.";
    }
  } finally {
    isLoading.value = false;
  }
};
</script>
