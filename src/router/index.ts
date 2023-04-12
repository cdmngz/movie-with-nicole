import { createWebHistory, createRouter } from "vue-router";
import Home from "../views/Home.vue";
import Dashboard from "../views/Dashboard.vue";
import Settings from "../views/Settings.vue";
import { get } from "../store";

const routes = [
  {
    path: "/",
    component: Home,
    meta: {
      requiresGuest: true,
    },
  },
  {
    path: "/dashboard",
    component: Dashboard,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/settings",
    component: Settings,
    meta: {
      requiresAuth: true,
    },
  },
];

const history = createWebHistory();

const router = createRouter({
  history,
  routes,
});

// router.beforeEach((to, from, next) => {
//   const requiresAuth = to.matched.some((x) => x.meta.requiresAuth);
//   const requiresGuest = to.matched.some((x) => x.meta.requiresGuest);

//   if (requiresAuth) {
//     if (get.uid()) {
//       next();
//     } else {
//       next({ path: "/" });
//     }
//   } else if (requiresGuest) {
//     if (!get.uid()) {
//       next();
//     } else {
//       next({ path: "/dashboard" });
//     }
//   } else {
//     next({ path: "/" });
//   }
// });

export default router;
