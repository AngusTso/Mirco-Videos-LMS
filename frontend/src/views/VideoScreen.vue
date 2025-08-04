!-- src/views/VideoScreen.vue -->
<template>
  <div class="max-w-6xl mx-auto p-6 bg-white shadow-md rounded-lg">
    <!-- Loading State -->
    <div v-if="isLoading" class="text-center text-gray-500">
      Loading video...
    </div>

    <!-- Error Messages -->
    <p v-if="error" class="mb-4 text-sm text-red-600">{{ error }}</p>
    <p v-if="videoError" class="mb-4 text-sm text-red-600">{{ videoError }}</p>

    <!-- Video Player Section -->
    <div v-if="video" class="mb-8">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">{{ video.title }}</h2>
      <p class="text-gray-600 mb-4">
        {{ `Description: ${video.description}` }}
      </p>
      <video
        controls
        class="w-full max-h-[500px] rounded-md shadow-sm"
        @error="handleVideoError"
        @loadeddata="handleVideoLoaded"
        preload="metadata"
      >
        <source :src="videoStreamUrl" :type="videoMimeType" />
        Your browser does not support the video tag or the file format.
      </video>
    </div>

    <!-- Rating Section -->
    <div v-if="video" class="mb-8">
      <h3 class="text-xl font-semibold text-gray-800 mb-4">Rate this Video</h3>
      <div class="flex items-center mb-4">
        <div class="flex">
          <button
            v-for="star in 5"
            :key="star"
            @click="submitRating(star)"
            @mouseenter="hoverRating = star"
            @mouseleave="hoverRating = 0"
            class="text-2xl"
            :class="{
              'text-yellow-400': star <= (hoverRating || userRating || 0),
              'text-gray-300': star > (hoverRating || userRating || 0),
            }"
          >
            ★
          </button>
        </div>
        <span v-if="averageRating" class="ml-4 text-gray-600">
          Average Rating: {{ averageRating.toFixed(1) }} / 5
        </span>
      </div>
      <p v-if="ratingError" class="text-sm text-red-600">{{ ratingError }}</p>
    </div>

    <!-- Comments Section -->
    <div v-if="video" class="mb-8">
      <h3 class="text-xl font-semibold text-gray-800 mb-4">Comments</h3>
      <div class="mb-4">
        <textarea
          v-model="newComment"
          placeholder="Add a comment..."
          class="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
        <button
          @click="submitComment"
          :disabled="isPostingComment || !newComment"
          class="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
        >
          {{ isPostingComment ? "Posting..." : "Post Comment" }}
        </button>
        <p v-if="commentError" class="mt-2 text-sm text-red-600">
          {{ commentError }}
        </p>
      </div>
      <div v-if="comments.length" class="space-y-4">
        <div
          v-for="comment in comments"
          :key="comment._id"
          class="border-b pb-2"
        >
          <p class="text-gray-800 font-semibold">
            {{ comment.userId.username }}
          </p>
          <p class="text-gray-700 mb-2 mt-2">
            {{ `Comment: ${comment.content}` }}
          </p>
          <p v-if="comment.timestamp" class="text-sm text-gray-500">
            At {{ formatTimestamp(comment.timestamp) }}
          </p>
          <p class="text-sm text-gray-500">
            Posted on {{ new Date(comment.createdAt).toLocaleString() }}
          </p>
        </div>
      </div>
      <p v-else class="text-gray-600">No comments yet.</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import { useAuthStore } from "../store";

export default defineComponent({
  name: "VideoScreen",
  setup() {
    const route = useRoute();
    const authStore = useAuthStore();
    const video = ref<any>(null);
    const comments = ref<any[]>([]);
    const userRating = ref<number | null>(null);
    const averageRating = ref<number | null>(null);
    const hoverRating = ref(0);
    const newComment = ref("");
    const commentTimestamp = ref<number | null>(null);
    const isLoading = ref(true);
    const isPostingComment = ref(false);
    const error = ref("");
    const commentError = ref("");
    const ratingError = ref("");
    const videoError = ref("");

    // Compute the video stream URL // just for easy access during demo
    const videoStreamUrl = computed(() => {
      if (!video.value?.streamUrl) {
        console.log(
          "videoStreamUrl: No streamUrl in video.value:",
          video.value
        );
        return "";
      }
      console.log("Computed Video Stream URL:", video.value.streamUrl);
      return video.value.streamUrl;
    });

    // Compute MIME type
    const videoMimeType = computed(() => {
      if (!video.value?.filePath) return "video/mp4";
      const ext = video.value.filePath.split(".").pop()?.toLowerCase();
      const mimeTypes = {
        mp4: "video/mp4",
        mov: "video/quicktime",
        avi: "video/x-msvideo",
        webm: "video/webm",
      };
      const mimeType = mimeTypes[ext as keyof typeof mimeTypes] || "video/mp4";
      console.log("Computed Video MIME Type:", mimeType);
      return mimeType;
    });

    // Format timestamp for comments
    const formatTimestamp = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    };

    // Fetch video details
    const fetchVideo = async () => {
      const videoId = route.params.videoId as string;
      console.log("Fetching video with ID:", videoId);
      console.log("Auth Token:", authStore.token || "No token found");
      isLoading.value = true;
      try {
        const response = await axios.get(
          `http://localhost:3000/api/videos/${videoId}`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        video.value = response.data;
      } catch (err: any) {
        error.value = err.response?.data?.message || "Failed to fetch video";
        console.error("Fetch Video Error:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          headers: err.response?.headers,
        });
      } finally {
        isLoading.value = false;
        console.log("Final Video Value:", video.value);
        console.log("vvaavva:", video.value);
      }
    };

    // Fetch comments
    const fetchComments = async () => {
      const videoId = route.params.videoId as string;
      console.log("vids", videoId);
      try {
        const response = await axios.get(
          `http://localhost:3000/api/videos/${videoId}/comments/`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        comments.value = response.data;
        console.log("Fetched Comments:", response.data);
      } catch (err: any) {
        commentError.value =
          err.response?.data?.message || "Failed to fetch comments";
        console.error("Fetch Comments Error:", err.response?.data || err);
      }
    };

    // Fetch ratings
    const fetchRatings = async () => {
      const videoId = route.params.videoId as string;
      try {
        const response = await axios.get(
          `http://localhost:3000/api/videos/${videoId}/ratings`,
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        userRating.value = response.data.userRating || null;
        averageRating.value = response.data.averageRating || null;
        console.log("Fetched Ratings:", response.data);
      } catch (err: any) {
        ratingError.value =
          err.response?.data?.message || "Failed to fetch ratings";
        console.error("Fetch Ratings Error:", err.response?.data || err);
      }
    };

    // Submit a comment
    const submitComment = async () => {
      if (!newComment.value.trim()) {
        commentError.value = "Comment cannot be empty";
        return;
      }
      isPostingComment.value = true;
      try {
        const videoId = route.params.videoId as string;
        await axios.post(
          `http://localhost:3000/api/videos/${videoId}/comments/`,
          {
            videoId,
            content: newComment.value,
            timestamp: commentTimestamp.value,
          },
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        newComment.value = "";
        commentTimestamp.value = null;
        commentError.value = "";
        await fetchComments();
      } catch (err: any) {
        commentError.value =
          err.response?.data?.message || "Failed to post comment";
        console.error("Post Comment Error:", err.response?.data || err);
      } finally {
        isPostingComment.value = false;
      }
    };

    // Submit a rating
    const submitRating = async (rating: number) => {
      try {
        const videoId = route.params.videoId as string;
        await axios.post(
          `http://localhost:3000/api/videos/${videoId}/ratings`,
          {
            videoId,
            rating,
          },
          {
            headers: { Authorization: `Bearer ${authStore.token}` },
          }
        );
        userRating.value = rating;
        ratingError.value = "";
        await fetchRatings();
      } catch (err: any) {
        ratingError.value =
          err.response?.data?.message || "Failed to submit rating";
        console.error("Submit Rating Error:", err.response?.data || err);
      }
    };

    // Handle video playback errors
    const handleVideoError = (event: Event) => {
      const videoElement = event.target as HTMLVideoElement;
      const errorMessage = videoElement.error
        ? `Video playback error: ${videoElement.error.message} (Code: ${videoElement.error.code})`
        : "Video playback error: Unknown error";
      videoError.value = errorMessage;
      console.error(errorMessage, videoElement.error);
      console.error("Video Source URL:", videoElement.currentSrc);
    };

    // Handle video loaded event
    const handleVideoLoaded = () => {
      console.log("Video loaded successfully");
      videoError.value = "";
    };

    // Fetch data on mount
    onMounted(() => {
      console.log("Auth Token:", authStore.token || "No token found");
      fetchVideo();
      fetchComments();
      fetchRatings();
    });

    return {
      video,
      videoStreamUrl,
      videoMimeType,
      comments,
      userRating,
      averageRating,
      hoverRating,
      newComment,
      commentTimestamp,
      isLoading,
      isPostingComment,
      error,
      commentError,
      ratingError,
      videoError,
      handleVideoError,
      handleVideoLoaded,
      submitComment,
      submitRating,
      formatTimestamp,
    };
  },
});
</script>
