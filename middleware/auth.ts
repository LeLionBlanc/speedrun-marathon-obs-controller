export default defineNuxtRouteMiddleware((_to) => {
  if (process.server) return;
});