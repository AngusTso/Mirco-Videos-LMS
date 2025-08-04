<!-- src/components/VideoList.vue -->
<template>
  <div class="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
    <h2 class="text-2xl font-bold text-gray-800 mb-6">My Videos</h2>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center text-gray-500">
      Loading videos...
    </div>

    <!-- Error Message -->
    <p v-if="error" class="mb-4 text-sm text-red-600">{{ error }}</p>

    <!-- Video List -->
    <div v-if="videos.length" class="grid gap-4">
      <div
        v-for="video in videos"
        :key="video.id"
        class="p-4 bg-gray-50 rounded-md shadow-sm flex justify-between items-center"
      >
        <div>
          <h3 class="text-lg font-semibold text-gray-800">{{ video.title }}</h3>
          <p class="text-sm text-gray-600">{{ video.description }}</p>
        </div>
        <div class="flex space-x-2">
          <button
            class="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200"
            @click="openVideo(video.id)"
          >
            Open
          </button>
          <button
            class="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition duration-200"
            @click="openInviteModal(video.id)"
          >
            Invite
          </button>
        </div>
      </div>
    </div>
    <p v-else-if="!isLoading" class="text-gray-500">No videos uploaded yet.</p>

    <!-- Invite Modal -->
    <div
      v-if="showInviteModal"
      class="fixed inset-0 bg-opacity-50 flex items-center justify-center"
    >
      <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 class="text-xl font-bold text-gray-800 mb-4">
          Invite to Review Video
        </h3>
        <form @submit.prevent="sendInvite">
          <!-- Society Dropdown -->
          <div class="mb-4">
            <label
              for="society"
              class="block text-sm font-medium text-gray-700 mb-2"
              >Select Society</label
            >
            <select
              id="society"
              v-model="selectedSociety"
              @change="fetchSocietyMembers"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a society</option>
              <option
                v-for="society in societies"
                :key="society.id"
                :value="society.id"
              >
                {{ society.name }}
              </option>
            </select>
          </div>

          <!-- Member Dropdown -->
          <div v-if="selectedSociety" class="mb-4">
            <label
              for="member"
              class="block text-sm font-medium text-gray-700 mb-2"
              >Select Member</label
            >
            <select
              id="member"
              v-model="selectedMember"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a member</option>
              <option
                v-for="member in societyMembers"
                :key="member.id"
                :value="member.id"
              >
                {{ member.username }}
              </option>
            </select>
          </div>

          <!-- Username Input -->
          <div class="mb-4">
            <label
              for="username"
              class="block text-sm font-medium text-gray-700 mb-2"
              >Or Enter Username</label
            >
            <input
              type="text"
              id="username"
              v-model="inviteUsername"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter username"
            />
          </div>

          <!-- Error Message -->
          <p v-if="inviteError" class="mb-4 text-sm text-red-600">
            {{ inviteError }}
          </p>

          <!-- Buttons -->
          <div class="flex justify-end space-x-4">
            <button
              type="button"
              @click="closeInviteModal"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSendingInvite"
              class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-200 disabled:opacity-50"
            >
              {{ isSendingInvite ? "Sending..." : "Send Invite" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAuthStore } from "../store";

export default defineComponent({
  name: "VideoList",
  setup() {
    const authStore = useAuthStore();
    const router = useRouter();
    const videos = ref<any[]>([]);
    const societies = ref<any[]>([]);
    const societyMembers = ref<any[]>([]);
    const selectedSociety = ref("");
    const selectedMember = ref("");
    const inviteUsername = ref("");
    const inviteVideoId = ref("");
    const showInviteModal = ref(false);
    const isLoading = ref(true);
    const isSendingInvite = ref(false);
    const error = ref("");
    const inviteError = ref("");

    // Fetch student's own videos
    const fetchVideos = async () => {
      isLoading.value = true;
      try {
        const response = await axios.get(
          "http://localhost:3000/api/videos/own",
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        videos.value = response.data.map((vid: any) => ({
          ...vid,
          id: vid._id,
        }));
      } catch (err: any) {
        error.value = err.response?.data?.message || "Failed to fetch videos";
      } finally {
        isLoading.value = false;
      }
    };

    // Fetch societies the student belongs to
    const fetchSocieties = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/societies",
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        societies.value = response.data.map((society: any) => ({
          ...society,
          id: society._id,
          members: society.members.map((member: any) => ({
            ...member,
            id: member._id,
          })),
        }));
      } catch (err: any) {
        error.value =
          err.response?.data?.message || "Failed to fetch societies";
      }
    };

    // Fetch members of the selected society
    const fetchSocietyMembers = async () => {
      if (!selectedSociety.value) {
        societyMembers.value = [];
        return;
      }
      try {
        const response = await axios.get(
          `http://localhost:3000/api/societies/${selectedSociety.value}/members`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        societyMembers.value = response.data;
      } catch (err: any) {
        inviteError.value =
          err.response?.data?.message || "Failed to fetch society members";
      }
    };

    // Open invite modal
    const openInviteModal = (videoId: string) => {
      inviteVideoId.value = videoId;
      showInviteModal.value = true;
      selectedSociety.value = "";
      selectedMember.value = "";
      inviteUsername.value = "";
      societyMembers.value = [];
      inviteError.value = "";
    };

    // Close invite modal
    const closeInviteModal = () => {
      showInviteModal.value = false;
    };

    // Send invite
    const sendInvite = async () => {
      if (!selectedMember.value && !inviteUsername.value) {
        inviteError.value = "Please select a member or enter a username";
        return;
      }

      isSendingInvite.value = true;
      inviteError.value = "";

      try {
        const username = selectedMember.value || inviteUsername.value;
        await axios.post(
          `http://localhost:3000/api/invite/${inviteVideoId.value}/invite`,
          { username },
          { headers: { Authorization: `Bearer ${authStore.token}` } }
        );
        closeInviteModal();
      } catch (err: any) {
        inviteError.value =
          err.response?.data?.message || "Failed to send invite";
      } finally {
        isSendingInvite.value = false;
      }
    };

    // Navigate to VideoScreen.vue with videoId
    const openVideo = (videoId: string) => {
      router.push({ name: "VideoScreen", params: { videoId } });
    };

    // Fetch data on mount
    onMounted(() => {
      fetchVideos();
      fetchSocieties();
    });

    return {
      videos,
      societies,
      societyMembers,
      selectedSociety,
      selectedMember,
      inviteUsername,
      inviteVideoId,
      showInviteModal,
      isLoading,
      isSendingInvite,
      error,
      inviteError,
      fetchSocietyMembers,
      openInviteModal,
      closeInviteModal,
      sendInvite,
      openVideo,
    };
  },
});
</script>
