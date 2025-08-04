// src/store/auth.ts
import { defineStore } from "pinia";
import { ref } from "vue";

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(null);
  const userId = ref<string | null>(null);
  const role = ref<string | null>(null);

  function setAuthData(newToken: string, newUserId: string, newRole: string) {
    token.value = newToken;
    userId.value = newUserId;
    role.value = newRole;
    localStorage.setItem("token", newToken);
  }

  function clearAuthData() {
    token.value = null;
    userId.value = null;
    role.value = null;
    localStorage.removeItem("token");
  }

  function isAuthenticated() {
    return !!token.value;
  }

  return { token, userId, role, setAuthData, clearAuthData, isAuthenticated };
});
