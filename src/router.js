import { createRouter, createWebHistory } from "vue-router"

// Cocoda has no real routes: the router is used only to keep the selection in
// the URL query (see store/plugins.js).
const router = createRouter({
  history: createWebHistory(),
  // Cocoda navigates only by query, never by path. A catch-all keeps
  // vue-router from warning "No match found for location" on every navigation.
  routes: [
    { path: "/:pathMatch(.*)*", component: { render: () => null } },
  ],
})

export default router
