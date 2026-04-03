<script lang="ts">
  import { onDestroy } from "svelte";

  import HostGameScreen from "./features/host/HostGameScreen.svelte";
  import JoinScreen from "./features/player/JoinScreen.svelte";
  import PlayerBoardScreen from "./features/player/PlayerBoardScreen.svelte";
  import NotFoundScreen from "./features/shared/NotFoundScreen.svelte";
  import { resolveRoutePath } from "./app/navigation";

  let currentPath = $state(getCurrentPath());

  function getCurrentPath(): string {
    if (typeof window === "undefined") {
      return "/";
    }

    return resolveRoutePath(window.location.pathname);
  }

  function syncCurrentPath(): void {
    currentPath = getCurrentPath();
  }

  if (typeof window !== "undefined") {
    window.addEventListener("popstate", syncCurrentPath);
  }

  onDestroy(() => {
    if (typeof window !== "undefined") {
      window.removeEventListener("popstate", syncCurrentPath);
    }
  });
</script>

<svelte:head>
  <title>Jeopardy</title>
</svelte:head>

<main class="app-shell">
  {#if currentPath === "/"}
    <HostGameScreen />
  {:else if currentPath === "/join"}
    <JoinScreen />
  {:else if currentPath === "/player"}
    <PlayerBoardScreen />
  {:else}
    <NotFoundScreen />
  {/if}
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
