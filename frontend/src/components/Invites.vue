<template>
  <div class="p-6">
    <h2 class="text-2xl font-bold text-gray-800 mb-4">Invited Videos</h2>
    <div v-if="loading" class="text-center text-gray-500">Loading...</div>
    <div v-else-if="error" class="text-center text-red-500">{{ error }}</div>
    <div v-else-if="videos.length === 0" class="text-center text-gray-500">
      No invited videos found.
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="video in videos"
        :key="video.id"
        class="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition duration-200"
      >
        <h3 class="text-lg font-semibold text-gray-700">{{ video.title }}</h3>
        <p class="text-gray-600 mt-2">{{ video.description }}</p>
        <p class="text-sm text-gray-500 mt-1">
          Invited by: {{ video.invitedBy }}
        </p>
        <p class="text-sm text-gray-500">
          Uploaded: {{ formatDate(video.createdAt) }}
        </p>

        <p class="text-sm text-gray-500">Status: {{ video.inviteStatus }}</p>
        <button
          @click="openVideo(video.id)"
          class="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
        >
          View Video
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import axios from "axios";
import { useAuthStore } from "../store";
import { useRouter } from "vue-router";

interface Video {
  id: string;
  title: string;
  description: string;
  visibility: string;
  fileUrl: string;
  createdAt: string;
  invitedBy: string;
  inviteStatus: string;
}

export default defineComponent({
  name: "Invites",
  setup() {
    const videos = ref<Video[]>([]);
    const loading = ref(true);
    const error = ref<string | null>(null);
    const authStore = useAuthStore();
    const router = useRouter();

    const fetchInvitedVideos = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/invite/getAcceptedInvites",
          {
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          }
        );
        console.log(response.data);
        videos.value = response.data;
      } catch (err: any) {
        error.value =
          err.response?.data?.message || "Failed to fetch invited videos.";
        console.error(err);
      } finally {
        loading.value = false;
      }
    };
    const openVideo = (videoId: string) => {
      console.log(videoId);
      router.push({ name: "VideoScreen", params: { videoId } });
    };

    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    };

    onMounted(fetchInvitedVideos);

    return { videos, loading, error, formatDate, openVideo };
  },
});
</script>
