<!-- src/components/VideoUpload.vue -->
<template>
  <div class="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg">
    <h2 class="text-2xl font-bold text-gray-800 mb-6">Upload Video</h2>
    <form @submit.prevent="handleSubmit" enctype="multipart/form-data">
      <!-- Video File Input -->
      <div class="mb-4">
        <label for="video" class="block text-sm font-medium text-gray-700 mb-2"
          >Select Video</label
        >
        <input
          type="file"
          id="video"
          accept="video/mp4,video/quicktime,video/x-msvideo"
          @change="handleFileChange"
          :disabled="isUploading"
          class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
        />
        <p v-if="fileError" class="mt-2 text-sm text-red-600">
          {{ fileError }}
        </p>
      </div>

      <!-- Title Input -->
      <div class="mb-4">
        <label for="title" class="block text-sm font-medium text-gray-700 mb-2"
          >Title</label
        >
        <input
          type="text"
          id="title"
          v-model="title"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter video title"
          required
          :disabled="isUploading"
        />
      </div>

      <!-- Description Input -->
      <div class="mb-4">
        <label
          for="description"
          class="block text-sm font-medium text-gray-700 mb-2"
          >Description</label
        >
        <textarea
          id="description"
          v-model="description"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter video description"
          rows="4"
          :disabled="isUploading"
        ></textarea>
      </div>

      <!-- Buttons -->
      <div class="flex justify-end space-x-4">
        <button
          type="button"
          @click="resetForm"
          class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition duration-200"
          :disabled="isUploading"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="isUploading || !videoFile"
          class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-200 disabled:opacity-50"
        >
          {{ isUploading ? "Uploading..." : "Upload" }}
        </button>
      </div>

      <!-- Error/Success Messages -->
      <p v-if="error" class="mt-4 text-sm text-red-600">{{ error }}</p>
      <p v-if="success" class="mt-4 text-sm text-green-600">{{ success }}</p>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAuthStore } from "../store";

export default defineComponent({
  name: "VideoUpload",
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();

    const title = ref("");
    const description = ref("");
    const videoFile = ref<File | null>(null);
    const fileError = ref("");
    const error = ref("");
    const success = ref("");
    const isUploading = ref(false);

    const handleFileChange = (event: Event) => {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      videoFile.value = null; // Reset before validation
      fileError.value = "";

      if (!file) {
        fileError.value = "Please select a video file";
        return;
      }

      const validMimeTypes = [
        "video/mp4",
        "video/quicktime",
        "video/x-msvideo",
      ];
      const validExtensions = /\.(mp4|mov|avi)$/i;

      if (
        !validMimeTypes.includes(file.type) ||
        !validExtensions.test(file.name)
      ) {
        fileError.value = "Only MP4, MOV, or AVI files are allowed";
        return;
      }

      if (file.size > 1024 * 1024 * 1024) {
        fileError.value = "File size exceeds 1GB limit";
        return;
      }

      videoFile.value = file;
    };

    const handleSubmit = async () => {
      if (!videoFile.value) {
        fileError.value = "Please select a valid video file";
        return;
      }

      if (!title.value) {
        error.value = "Title is required";
        return;
      }

      isUploading.value = true;
      error.value = "";
      success.value = "";

      const formData = new FormData();
      formData.append("video", videoFile.value);
      formData.append("title", title.value);
      formData.append("description", description.value);

      try {
        const response = await axios.post(
          "http://localhost:3000/api/videos",
          formData,
          {
            headers: {
              Authorization: `Bearer ${authStore.token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        success.value = "Video uploaded successfully!";
        resetForm();
        setTimeout(() => {
          router.push("/dashboard/videos");
        }, 2000);
      } catch (err: any) {
        error.value = err.response?.data?.message || "Failed to upload video";
      } finally {
        isUploading.value = false;
      }
    };

    const resetForm = () => {
      title.value = "";
      description.value = "";
      videoFile.value = null;
      fileError.value = "";
      error.value = "";
      success.value = "";
      const fileInput = document.getElementById("video") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    };

    return {
      title,
      description,
      videoFile,
      fileError,
      error,
      success,
      isUploading,
      handleFileChange,
      handleSubmit,
      resetForm,
    };
  },
});
</script>
