<script lang="ts">
  import type { ScoreboardPlayer } from "src/realtime/messages";

  type Props = {
    players: ScoreboardPlayer[];
  };

  let { players }: Props = $props();
</script>

<section class="scoreboard">
  <h2>Scores</h2>

  {#if players.length === 0}
    <p>No players have joined yet.</p>
  {:else}
    <ul>
      {#each players as player (player.id)}
        <li>
          <span>{player.displayName}</span>
          <span>{player.score}</span>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .scoreboard {
    display: grid;
    gap: 0.75rem;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.5rem;
  }

  li {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    border: 1px solid #374151;
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    background: #111827;
  }
</style>
