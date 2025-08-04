<template>
  <div class="society-list">
    <h2 class="text-2xl font-bold mb-4 text-gray-800">Societies</h2>
    <div v-if="userRole === 'Teacher'" class="actions mb-6">
      <button
        @click="openCreateModal"
        class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
      >
        Create Society
      </button>
    </div>
    <table class="w-full border-collapse bg-white shadow-md rounded-lg">
      <thead>
        <tr class="bg-gray-100">
          <th class="border border-gray-300 p-3 text-left text-gray-700">
            Name
          </th>
          <th class="border border-gray-300 p-3 text-left text-gray-700">
            Description
          </th>
          <th class="border border-gray-300 p-3 text-left text-gray-700">
            Mentor
          </th>
          <th class="border border-gray-300 p-3 text-left text-gray-700">
            Members
          </th>
          <th
            v-if="userRole === 'Teacher'"
            class="border border-gray-300 p-3 text-left text-gray-700"
          >
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="society in societies" :key="society.id">
          <td class="border border-gray-300 p-3">{{ society.name }}</td>
          <td class="border border-gray-300 p-3">{{ society.description }}</td>
          <td class="border border-gray-300 p-3">
            {{ society.mentor?.username || "N/A" }}
          </td>
          <td class="border border-gray-300 p-3">
            {{
              (society.members || []).length > 0
                ? (society.members || [])
                    .slice(0, 2)
                    .map((m) => m.username)
                    .join(", ") +
                  ((society.members || []).length > 2 ? ", ..." : "")
                : "No members"
            }}
          </td>
          <td
            v-if="userRole === 'Teacher'"
            class="border border-gray-300 p-3 space-x-2"
          >
            <button
              @click="openEditModal(society)"
              class="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600 transition duration-200"
            >
              Edit
            </button>
            <button
              @click="openAddMemberModal(society)"
              class="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition duration-200"
            >
              Add Member
            </button>
            <button
              @click="openViewMembersModal(society)"
              class="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition duration-200"
            >
              View Members
            </button>
            <button
              @click="deleteSociety(society.id)"
              class="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition duration-200"
            >
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Create/Edit Society Modal -->
    <div
      v-if="showCreateModal || showEditModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div class="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
        <h3 class="text-xl font-semibold mb-4 text-gray-800">
          {{ showCreateModal ? "Create Society" : "Edit Society" }}
        </h3>
        <form @submit.prevent="submitSociety" class="space-y-4">
          <label class="block">
            <span class="text-gray-700">Name:</span>
            <input
              v-model="form.name"
              type="text"
              required
              class="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
          <label class="block">
            <span class="text-gray-700">Description:</span>
            <textarea
              v-model="form.description"
              class="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </label>
          <div class="flex space-x-4">
            <button
              type="submit"
              class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
            >
              {{ showCreateModal ? "Create" : "Update" }}
            </button>
            <button
              type="button"
              @click="closeModal"
              class="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add Member Modal -->
    <div
      v-if="showAddMemberModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div class="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
        <h3 class="text-xl font-semibold mb-4 text-gray-800">
          Add Members to {{ selectedSociety?.name }}
        </h3>
        <form @submit.prevent="addMembers" class="space-y-4">
          <label class="block">
            <span class="text-gray-700">Usernames (comma-separated):</span>
            <input
              v-model="memberUsernames"
              type="text"
              placeholder="user1, user2"
              required
              class="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
          <div class="flex space-x-4">
            <button
              type="submit"
              class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
            >
              Add
            </button>
            <button
              type="button"
              @click="closeModal"
              class="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- View Members Modal -->
    <div
      v-if="showViewMembersModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div class="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
        <h3 class="text-xl font-semibold mb-4 text-gray-800">
          Members of {{ selectedSociety?.name }}
        </h3>
        <div v-if="selectedSociety?.members?.length" class="space-y-2">
          <div
            v-for="member in selectedSociety.members"
            :key="member.id"
            class="flex justify-between items-center border-b border-gray-200 py-2"
          >
            <span>{{ member.username }}</span>
            <button
              @click="removeMember(selectedSociety.id, member.id)"
              class="text-red-500 hover:text-red-700"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <p v-else class="text-gray-600">No members</p>
        <div class="mt-4">
          <button
            @click="closeModal"
            class="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import axios from "axios";
import { useAuthStore } from "../store";

interface Society {
  id: string;
  name: string;
  description: string;
  members: { id: string; username: string }[] | null;
  mentor: { username: string } | null;
}

export default defineComponent({
  name: "SocietyList",
  setup() {
    const authStore = useAuthStore();
    const userRole = computed(() => authStore.role || "Student"); // Default to 'Student' if null
    const societies = ref<Society[]>([]);
    const showCreateModal = ref(false);
    const showEditModal = ref(false);
    const showAddMemberModal = ref(false);
    const showViewMembersModal = ref(false);
    const selectedSociety = ref<Society | null>(null);
    const form = ref({ name: "", description: "" });
    const memberUsernames = ref("");

    const fetchSocieties = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/societies",
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );

        // Ensure members is an array for each society
        societies.value = response.data.map((society: any) => ({
          ...society,
          id: society._id,
          members: (society.members || []).map((member: any) => ({
            id: member._id, // Map member _id to id
            username: member.username,
          })), // Fallback to empty array
        }));
        console.log(societies.value);
      } catch (error) {
        console.error("Error fetching societies:", error);
      }
    };

    const openCreateModal = () => {
      console.log("openCreateModal triggered, userRole:", userRole.value); // Debug log
      form.value = { name: "", description: "" };
      showCreateModal.value = true;
    };

    const openEditModal = (society: Society) => {
      selectedSociety.value = society;
      form.value = { name: society.name, description: society.description };
      showEditModal.value = true;
    };

    const openViewMembersModal = (society: Society) => {
      selectedSociety.value = society;
      showViewMembersModal.value = true;
    };

    const openAddMemberModal = (society: Society) => {
      selectedSociety.value = society;
      memberUsernames.value = "";
      showAddMemberModal.value = true;
    };

    const closeModal = () => {
      showCreateModal.value = false;
      showEditModal.value = false;
      showAddMemberModal.value = false;
      showViewMembersModal.value = false;
      selectedSociety.value = null;
    };

    const submitSociety = async () => {
      try {
        const payload = {
          name: form.value.name,
          description: form.value.description,
        };
        console.log(payload);
        if (showCreateModal.value) {
          await axios.post("http://localhost:3000/api/societies/", payload, {
            headers: {
              Authorization: `Bearer ${authStore.token}`,
              "Content-Type": "application/json",
            },
          });
        } else if (selectedSociety.value) {
          await axios.put(
            `http://localhost:3000/api/societies/${selectedSociety.value.id}`,
            payload,
            {
              headers: {
                Authorization: `Bearer ${authStore.token}`,
                "Content-Type": "application/json",
              },
            }
          );
        }
        await fetchSocieties();
        closeModal();
      } catch (error) {
        console.error("Error submitting society:", error);
      }
    };

    const addMembers = async () => {
      if (!selectedSociety.value) return;
      try {
        const usernames = memberUsernames.value.split(",").map((u) => u.trim());
        await axios.post(
          `http://localhost:3000/api/societies/${selectedSociety.value.id}/members/username`,
          { usernames },
          { headers: { Authorization: `Bearer ${authStore.token}` } }
        );
        await fetchSocieties();
        closeModal();
      } catch (error) {
        console.error("Error adding members:", error);
      }
    };

    const removeMember = async (societyId: string, userId: string) => {
      try {
        console.log("Removing member:", userId, "from society:", societyId);
        const response = await axios.delete(
          `http://localhost:3000/api/societies/${societyId}/members`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
            data: { userIds: [userId] },
          }
        );
        console.log("Remove member response:", response.data);

        // Update local state after successful API call
        societies.value = societies.value.map((society) =>
          society.id === societyId
            ? {
                ...society,
                members: (society.members || []).filter(
                  (member) => member.id !== userId
                ),
              }
            : society
        );
        if (selectedSociety.value?.id === societyId) {
          selectedSociety.value = {
            ...selectedSociety.value,
            members: (selectedSociety.value.members || []).filter(
              (member) => member.id !== userId
            ),
          };
        }
      } catch (error: any) {
        console.error(
          "Error removing member:",
          error.response?.data || error.message
        );
      }
    };

    const deleteSociety = async (societyId: string) => {
      if (confirm("Are you sure you want to delete this society?")) {
        try {
          await axios.delete(
            `http://localhost:3000/api/societies/${societyId}`,
            {
              headers: { Authorization: `Bearer ${authStore.token}` },
            }
          );
          await fetchSocieties();
        } catch (error) {
          console.error("Error deleting society:", error);
        }
      }
    };

    // Initial fetch
    fetchSocieties();

    return {
      userRole,
      societies,
      showCreateModal,
      showEditModal,
      showAddMemberModal,
      showViewMembersModal,
      selectedSociety,
      form,
      memberUsernames,
      openCreateModal,
      openEditModal,
      openAddMemberModal,
      openViewMembersModal,
      closeModal,
      submitSociety,
      addMembers,
      removeMember,
      deleteSociety,
    };
  },
});
</script>
