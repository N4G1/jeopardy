<script lang="ts">
  import type { ScoreboardPlayer } from "src/realtime/messages";

  type Props = {
    players: ScoreboardPlayer[];
    title?: string;
    emptyMessage?: string;
    variant?: "panel" | "strip";
  };

  let {
    players,
    title = "Scores",
    emptyMessage = "No players have joined yet.",
    variant = "panel",
  }: Props = $props();

  function formatScore(score: number): string {
    return score < 0 ? `-$${Math.abs(score)}` : `$${score}`;
  }

  const stripPlayerColors = ["#3f8f22", "#cb6228", "#8a1688", "#111111", "#1f5fbf", "#8b1e1e"];

  function getStripPlayerColor(playerIndex: number): string {
    return stripPlayerColors[playerIndex % stripPlayerColors.length] ?? stripPlayerColors[0] ?? "#244d1a";
  }
</script>

<section class:scoreboard--strip={variant === "strip"} class="scoreboard">
  {#if variant === "panel"}
    <h2>{title}</h2>
  {/if}

  {#if players.length === 0}
    <p>{emptyMessage}</p>
  {:else}
    <ul>
      {#each players as player, playerIndex (player.id)}
        <li
          style:background-color={variant === "strip" ? getStripPlayerColor(playerIndex) : undefined}
          style:font-weight={variant === "strip" ? "600" : undefined}
        >
          {#if variant === "strip"}
            <span>{player.displayName}: {formatScore(player.score)}</span>
          {:else}
            <span>{player.displayName}</span>
            <span>{player.score}</span>
          {/if}
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

  .scoreboard--strip ul {
    gap: 0;
    grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  }

  .scoreboard--strip {
    align-self: start;
  }

  .scoreboard--strip li {
    box-sizing: border-box;
    min-height: 5.4rem;
    justify-content: center;
    align-items: center;
    border-radius: 0;
    border: none;
    border-right: 2px solid #0f2d52;
    padding: 0.18rem 0.45rem;
    color: #f8fafc;
    font-size: clamp(1.9rem, 3vw, 2.6rem);
    font-weight: 600;
    line-height: 1.1;
    text-align: center;
  }

  .scoreboard--strip li:last-child {
    border-right: none;
  }
</style>
