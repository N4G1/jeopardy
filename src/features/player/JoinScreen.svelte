<script lang="ts">
  import { buildPlayerPath, getSearchParam } from "src/app/navigation";

  function getJoinCode(): string {
    if (typeof window === "undefined") {
      return "";
    }

    return getSearchParam(window.location.search, "code");
  }

  let displayName = $state("");
  let joinCode = $state(getJoinCode());

  function continueToPlayerScreen(): void {
    const safeDisplayName = displayName.trim();

    if (safeDisplayName.length === 0) {
      return;
    }

    window.history.pushState({}, "", buildPlayerPath(joinCode, safeDisplayName));
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
</script>

<section class="screen">
  <h1>Join game</h1>
  <p>Enter your display name and continue to the lobby.</p>

  <label>
    <span>Join code</span>
    <input type="text" bind:value={joinCode} />
  </label>

  <label>
    <span>Display name</span>
    <input type="text" bind:value={displayName} />
  </label>

  <button type="button" onclick={continueToPlayerScreen}>Join Lobby</button>
</section>

<style>
  .screen {
    max-width: 32rem;
    margin: 0 auto;
    padding: 2rem;
    display: grid;
    gap: 1rem;
  }

  label {
    display: grid;
    gap: 0.35rem;
  }

  input {
    width: 100%;
    box-sizing: border-box;
    border-radius: 0.5rem;
    border: 1px solid #4b5563;
    background: #111827;
    color: inherit;
    padding: 0.625rem 0.75rem;
  }

  button {
    border: none;
    border-radius: 0.75rem;
    background: #2563eb;
    color: #eff6ff;
    padding: 0.75rem 1rem;
    cursor: pointer;
  }
</style>
