<script lang="ts">
  import Router from "svelte-spa-router";

  import { routes } from "./app/router";
</script>

<svelte:head>
  <title>Jeopardy</title>
</svelte:head>

<main class="app-shell">
  <Router {routes} />
</main>

<style>
  :global(body) {
    margin: 0;
    font-family:
      Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: #111827;
    color: #f9fafb;
  }

  .app-shell {
    min-height: 100vh;
  }
</style>
