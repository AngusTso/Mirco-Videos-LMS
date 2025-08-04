// src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../store"; // Ensure correct path to auth store
import Dashboard from "../views/Dashboard.vue";
import Login from "../views/Login.vue";
import WelcomeMessage from "../components/WelcomeMessage.vue";
import UserList from "../components/UserList.vue";
import SocietyList from "../components/SocietyList.vue";
import VideoUpload from "../components/VideoUpload.vue";
import VideoList from "../components/VideoList.vue";
import VideoScreen from "../views/VideoScreen.vue";
import Invites from "../components/Invites.vue";
import Inbox from "../components/Inbox.vue";

declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean;
    roles?: string[];
  }
}

const routes = [
  {
    path: "/login",
    name: "Login",
    component: Login,
  },
  {
    path: "/dashboard/videos/:videoId",
    name: "VideoScreen",
    component: VideoScreen,
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: Dashboard,
    meta: { requiresAuth: true },
    children: [
      {
        path: "welcome",
        name: "WelcomeMessage",
        component: WelcomeMessage,
      },
      {
        path: "invites",
        name: "Invites",
        component: Invites,
      },
      {
        path: "videoUpload",
        name: "VideoUpload",
        component: VideoUpload,
      },
      {
        path: "videos",
        name: "Videos",
        component: VideoList,
      },
      {
        path: "inbox",
        name: "Inbox",
        component: Inbox,
      },
      {
        path: "users",
        name: "Users",
        component: UserList,
        meta: { roles: ["Admin"] },
      },
      {
        path: "societies",
        name: "Societies",
        component: SocietyList,
        meta: { roles: ["Admin", "Teacher"] },
      },
      {
        path: "",
        redirect: { name: "WelcomeMessage" }, // Default to WelcomeMessage
      },
    ],
  },
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/:pathMatch(.*)*", // Catch-all for 404s
    redirect: "/login",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated()) {
    next({ name: "Login" });
  } else if (
    to.meta.roles &&
    authStore.role &&
    !to.meta.roles.includes(authStore.role)
  ) {
    next({ name: "WelcomeMessage" }); // Redirect to safe route for role mismatch
  } else {
    next();
  }
});

export default router;
