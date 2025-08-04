```vue
<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-bold text-gray-800">User Management</h2>
      <button
        @click="openCreateModal"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
      >
        <i class="fas fa-plus mr-2"></i>Add User
      </button>
    </div>

    <div v-if="loading" class="text-gray-600">Loading users...</div>
    <div v-else-if="error" class="text-red-500 mb-4">{{ error }}</div>
    <div v-else-if="users.length === 0" class="text-gray-600">
      No users found.
    </div>
    <table v-else class="w-full border-collapse">
      <thead>
        <tr class="bg-gray-200">
          <th class="p-2 text-left">Username</th>
          <th class="p-2 text-left">Email</th>
          <th class="p-2 text-left">Role</th>
          <th class="p-2 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="user in users"
          :key="user.id"
          class="border-b hover:bg-gray-50"
        >
          <td class="p-2">{{ user.username }}</td>
          <td class="p-2">{{ user.email }}</td>
          <td class="p-2">{{ user.role }}</td>
          <td class="p-2">
            <button
              @click="openEditModal(user)"
              class="text-blue-500 hover:underline mr-2"
            >
              <i class="fas fa-edit"></i>
            </button>
            <button
              @click="deleteUser(user.id)"
              class="text-red-500 hover:underline"
            >
              <i class="fas fa-times"></i>
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal for Create/Edit User -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center"
    >
      <div class="bg-white p-6 rounded shadow-lg w-full max-w-md">
        <h3 class="text-xl font-bold mb-4">
          {{ isEditing ? "Edit User" : "Create User" }}
        </h3>
        <form @submit.prevent="saveUser">
          <div class="mb-4">
            <label class="block text-gray-700">Username</label>
            <input
              v-model="form.username"
              type="text"
              class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Username"
              :required="!isEditing"
            />
          </div>
          <div class="mb-4">
            <label class="block text-gray-700">Email</label>
            <input
              v-model="form.email"
              type="email"
              class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email Address"
              required
            />
          </div>
          <div class="mb-4">
            <label class="block text-gray-700"
              >Password {{ isEditing ? "(Optional)" : "" }}</label
            >
            <input
              v-model="form.password"
              type="password"
              class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              :required="!isEditing"
              placeholder="Password"
            />
          </div>
          <div class="mb-4">
            <label class="block text-gray-700">Role</label>
            <select
              v-model="form.role"
              class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="Admin">Admin</option>
              <option value="Teacher">Teacher</option>
              <option value="Student">Student</option>
            </select>
          </div>
          <div v-if="formError" class="text-red-500 mb-4">{{ formError }}</div>
          <div class="flex justify-end">
            <button
              type="button"
              @click="showModal = false"
              class="px-4 py-2 mr-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {{ isEditing ? "Update" : "Create" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import { useAuthStore } from "../store";
import axios from "axios";
import DOMPurify from "dompurify";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface UserForm {
  id?: string;
  username: string;
  email: string;
  password?: string;
  role: string;
}

export default defineComponent({
  name: "UserList",
  setup() {
    const authStore = useAuthStore();
    const users = ref<User[]>([]);
    const loading = ref(true);
    const error = ref<string | null>(null);
    const showModal = ref(false);
    const isEditing = ref(false);
    const form = ref<UserForm>({
      username: "",
      email: "",
      password: "",
      role: "Student",
    });
    const formError = ref<string | null>(null);

    const fetchUsers = async () => {
      console.log("Starting fetchUsers");
      console.log("Token:", authStore.token ? authStore.token : "No token");
      console.log("Role:", authStore.role ? authStore.role : "No role");
      if (!authStore.token) {
        error.value = "No authentication token available. Please log in again.";
        loading.value = false;
        return;
      }
      try {
        const response = await axios.get("http://localhost:3000/api/users", {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
            "Content-Type": "application/json",
          },
        });
        console.log("fetchUsers response:", response.data);
        users.value = response.data.map((user: any) => ({
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        }));
        console.log(users);
        error.value = null;
      } catch (err: any) {
        console.error("fetchUsers error:", err);
        error.value =
          err.response?.data?.message ||
          `Failed to fetch users: ${err.message}`;
      } finally {
        loading.value = false;
      }
    };

    const openCreateModal = () => {
      isEditing.value = false;
      form.value = { username: "", email: "", password: "", role: "Student" };
      formError.value = null;
      showModal.value = true;
    };

    const openEditModal = (user: User) => {
      isEditing.value = true;
      form.value = {
        username: user.username,
        id: user.id,
        email: user.email,
        role: user.role,
      };
      formError.value = null;
      showModal.value = true;
    };

    const saveUser = async () => {
      console.log("Starting saveUser");
      console.log("Token:", authStore.token);
      console.log("Form:", form.value);
      try {
        const sanitizedUsername = DOMPurify.sanitize(
          form.value.username.trim()
        );
        const sanitizedEmail = DOMPurify.sanitize(form.value.email.trim());
        const sanitizedPassword = form.value.password
          ? DOMPurify.sanitize(form.value.password)
          : undefined;
        const payload = isEditing.value
          ? {
              username: sanitizedUsername,
              email: sanitizedEmail,
              role: form.value.role,
              ...(sanitizedPassword && { password: sanitizedPassword }),
            }
          : {
              username: sanitizedUsername,
              email: sanitizedEmail,
              password: sanitizedPassword,
              role: form.value.role,
            };

        console.log("Payload:", payload);
        console.log(
          "URL:",
          isEditing.value
            ? `http://localhost:3000/api/users/${form.value.id}`
            : "http://localhost:3000/api/users"
        );
        console.log("Method:", isEditing.value ? "PUT" : "POST");

        const response = await axios({
          method: isEditing.value ? "PUT" : "POST",
          url: isEditing.value
            ? `http://localhost:3000/api/users/${form.value.id}`
            : "http://localhost:3000/api/users",
          headers: {
            Authorization: `Bearer ${authStore.token}`,
            "Content-Type": "application/json",
          },
          data: payload,
        });

        console.log("saveUser response:", response.data);

        if (isEditing.value) {
          users.value = users.value.map((user) =>
            user.id === response.data.id ? response.data : user
          );
        } else {
          users.value.push(response.data);
        }
        showModal.value = false;
        formError.value = null;
      } catch (err: any) {
        console.error("saveUser error:", err);
        formError.value =
          err.response?.data?.message ||
          (isEditing.value ? "Failed to update user" : "Failed to create user");
      }
    };

    const deleteUser = async (userId: string) => {
      if (!confirm("Are you sure you want to delete this user?")) return;
      try {
        await axios.delete(`http://localhost:3000/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        });
        users.value = users.value.filter((user) => user.id !== userId);
      } catch (err: any) {
        error.value = err.response?.data?.message || "Failed to delete user";
      }
    };

    onMounted(fetchUsers);

    return {
      users,
      loading,
      error,
      showModal,
      isEditing,
      form,
      formError,
      openCreateModal,
      openEditModal,
      saveUser,
      deleteUser,
    };
  },
});
</script>

<style scoped>
/* Tailwind CSS is used globally, so no additional styles needed here */
</style>
