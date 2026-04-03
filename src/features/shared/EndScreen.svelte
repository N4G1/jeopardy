<script lang="ts">
  import type { ScoreboardPlayer } from "src/realtime/messages";

  type Props = {
    title: string;
    players: ScoreboardPlayer[];
  };

  let { title, players }: Props = $props();

  type RankedPlayer = ScoreboardPlayer & {
    rank: number;
  };

  const rankedPlayers = $derived.by<RankedPlayer[]>(() =>
    [...players]
      .map((player, index) => ({ player, index }))
      .toSorted((left, right) => right.player.score - left.player.score || left.index - right.index)
      .map(({ player }, index) => ({
        ...player,
        rank: index + 1,
      })),
  );

  function formatScore(score: number): string {
    return score < 0 ? `-$${Math.abs(score)}` : `$${score}`;
  }

  function getRankClass(rank: number): string {
    if (rank === 1) {
      return "end-screen__badge--gold";
    }

    if (rank === 2) {
      return "end-screen__badge--silver";
    }

    if (rank === 3) {
      return "end-screen__badge--bronze";
    }

    return "";
  }
</script>

<section class="end-screen">
  <h1 class="end-screen__title">Overall score</h1>

  {#if rankedPlayers.length === 0}
    <p class="end-screen__empty">No players joined this game.</p>
  {:else}
    <ol class="end-screen__list">
      {#each rankedPlayers as player (player.id)}
        <li class="end-screen__item" class:end-screen__item--top-three={player.rank <= 3}>
          {#if player.rank <= 3}
            <span class={`end-screen__badge ${getRankClass(player.rank)}`}>{player.rank}</span>
          {/if}

          <span class="end-screen__name">{player.displayName}</span>
          <span class="end-screen__score">{formatScore(player.score)}</span>
        </li>
      {/each}
    </ol>
  {/if}
</section>

<style>
  .end-screen {
    min-height: 100vh;
    box-sizing: border-box;
    padding: 2rem 2rem 3rem 4rem;
    background: #111827;
    color: #f8fafc;
    display: grid;
    gap: 1.5rem;
    align-content: start;
  }

  .end-screen__title,
  .end-screen__subtitle,
  .end-screen__empty {
    margin: 0;
  }

  .end-screen__title {
    font-size: clamp(2rem, 3vw, 2.8rem);
  }

  .end-screen__subtitle {
    font-size: clamp(1.3rem, 2vw, 1.8rem);
    color: #d1d5db;
  }

  .end-screen__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 1rem;
  }

  .end-screen__item {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 1rem;
    min-height: 5.5rem;
    box-sizing: border-box;
    padding: 1rem 1.5rem;
    border: 2px solid #334155;
    background: #1f2937;
    color: #f8fafc;
    font-size: clamp(1.4rem, 2.2vw, 2rem);
    font-weight: 700;
  }

  .end-screen__item--top-three {
    padding-left: 2.5rem;
  }

  .end-screen__badge {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 3.25rem;
    height: 3.25rem;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid rgb(15 23 42 / 0.8);
    color: #101828;
    font-size: 1.4rem;
    font-weight: 900;
  }

  .end-screen__badge--gold {
    background: #f4d03f;
  }

  .end-screen__badge--silver {
    background: #d1d5db;
  }

  .end-screen__badge--bronze {
    background: #cd7f32;
  }

  .end-screen__name,
  .end-screen__score {
    line-height: 1.1;
  }
</style>
