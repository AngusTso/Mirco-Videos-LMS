<template>
  <div class="p-6 max-w-4xl mx-auto">
    <h2 class="text-2xl font-bold text-gray-800 mb-6">Pending Invitations</h2>
    <div v-if="loading" class="text-center text-gray-500">Loading...</div>
    <div v-else-if="error" class="text-center text-red-500">{{ error }}</div>
    <div v-else-if="invites.length === 0" class="text-center text-gray-500">
      No pending invitations.
    </div>
    <div v-else class="grid gap-4">
      <div
        v-for="invite in invites"
        :key="invite.id"
        class="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition duration-200"
      >
        <h3 class="text-lg font-semibold text-gray-700">{{ invite.title }}</h3>
        <p class="text-gray-600 mt-2">{{ invite.description }}</p>
        <p class="text-sm text-gray-500 mt-1">
          Invited by: {{ invite.invitedBy }}
        </p>
        <p class="text-sm text-gray-500">
          Uploaded: {{ formatDate(invite.createdAt) }}
        </p>
        <p class="text-sm text-gray-500">Status: {{ invite.inviteStatus }}</p>
        <div class="mt-4 flex space-x-2">
          <button
            @click="respondToInvite(invite.id, 'accepted')"
            :disabled="invite.isProcessing"
            class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition duration-200 disabled:opacity-50"
          >
            {{ invite.isProcessing ? "Processing..." : "Accept" }}
          </button>
          <button
            @click="respondToInvite(invite.id, 'rejected')"
            :disabled="invite.isProcessing"
            class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-200 disabled:opacity-50"
          >
            {{ invite.isProcessing ? "Processing..." : "Reject" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import axios from "axios";
import { useAuthStore } from "../store";

interface Invite {
  id: string; // Invite ID
  videoId: string;
  title: string;
  description: string;
  visibility: string;
  fileUrl: string;
  createdAt: string;
  invitedBy: string;
  inviteStatus: string;
  isProcessing?: boolean; // Added for button state
}

export default defineComponent({
  name: "Inbox",
  setup() {
    const invites = ref<Invite[]>([]);
    const loading = ref(true);
    const error = ref<string | null>(null);
    const authStore = useAuthStore();

    const fetchPendingInvites = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/invite/getPendingInvites",
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        invites.value = response.data.map((invite: Invite) => ({
          ...invite,
          isProcessing: false, // Initialize processing state
        }));
      } catch (err: any) {
        error.value =
          err.response?.data?.message || "Failed to fetch pending invitations.";
        console.error(err);
      } finally {
        loading.value = false;
      }
    };

    const respondToInvite = async (
      inviteId: string,
      status: "accepted" | "rejected"
    ) => {
      const invite = invites.value.find((i) => i.id === inviteId);
      if (!invite) return;
      console.log(inviteId);
      invite.isProcessing = true;
      try {
        await axios.post(
          `http://localhost:3000/api/invite/${inviteId}/respond`,
          { status },
          { headers: { Authorization: `Bearer ${authStore.token}` } }
        );
        // Remove invite from list after response
        invites.value = invites.value.filter((i) => i.id !== inviteId);
      } catch (err: any) {
        error.value =
          err.response?.data?.message || `Failed to ${status} invitation.`;
        console.error(err);
      } finally {
        invite.isProcessing = false;
      }
    };

    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    };

    onMounted(fetchPendingInvites);

    return { invites, loading, error, formatDate, respondToInvite };
  },
});
</script>
