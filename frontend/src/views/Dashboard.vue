<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Sidebar -->
    <div class="w-48 bg-white shadow-md">
      <div class="p-4">
        <h1 class="text-2xl font-bold text-gray-800">Video LMS</h1>
      </div>
      <nav class="mt-4">
        <ul>
          <li v-for="item in navItems" :key="item.name" class="mb-2">
            <router-link
              :to="item.path"
              class="block px-4 py-2 text-gray-700 hover:bg-blue-500 hover:text-white rounded transition duration-200"
              :class="{ 'bg-blue-500 text-white': $route.path === item.path }"
            >
              <i :class="item.icon" class="mr-2"></i>{{ item.name }}
            </router-link>
          </li>
          <li class="mb-2">
            <button
              @click="logout"
              class="w-full text-left px-4 py-2 text-gray-700 hover:bg-red-500 hover:text-white rounded transition duration-200"
            >
              <i class="fas fa-sign-out-alt mr-2"></i>Logout
            </button>
          </li>
        </ul>
      </nav>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 p-6 overflow-auto">
      <router-view />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../store";

interface NavItem {
  name: string;
  path: string;
  icon: string;
}

export default defineComponent({
  name: "Dashboard",
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();

    // Get user role from Pinia store, default to 'Student' if null
    const userRole = computed(() => authStore.role || "Student");

    // Role-based navigation items
    const navItems = computed<NavItem[]>(() => {
      const baseItems: NavItem[] = [];

      if (userRole.value === "Admin") {
        return [
          ...baseItems,
          { name: "Users", path: "/dashboard/users", icon: "fas fa-users" },
          {
            name: "Societies",
            path: "/dashboard/societies",
            icon: "fas fa-users-cog",
          },
          {
            name: "Audit Logs",
            path: "/dashboard/audit-logs",
            icon: "fas fa-file-alt",
          },
        ];
      } else if (userRole.value === "Teacher") {
        return [
          ...baseItems,
          {
            name: "Societies",
            path: "/dashboard/societies",
            icon: "fas fa-users-cog",
          },
          {
            name: "Invitations",
            path: "/dashboard/invites",
            icon: "fas fa-envelope",
          },
          { name: "Inbox", path: "/dashboard/inbox", icon: "fas fa-inbox" },
        ];
      } else {
        return [
          ...baseItems,
          {
            name: "Upload",
            path: "/dashboard/videoUpload",
            icon: "fas fa-upload",
          },
          {
            name: "My Videos",
            path: "/dashboard/videos",
            icon: "fas fa-video",
          },
          {
            name: "Invitations",
            path: "/dashboard/invites",
            icon: "fas fa-envelope",
          },
          { name: "Inbox", path: "/dashboard/inbox", icon: "fas fa-inbox" },
        ];
      }
    });

    // Logout function
    const logout = async () => {
      try {
        authStore.clearAuthData();
        await router.push("/login");
      } catch (error) {
        console.error("Logout failed:", error);
      }
    };

    return { navItems, logout, userRole };
  },
});
</script>
