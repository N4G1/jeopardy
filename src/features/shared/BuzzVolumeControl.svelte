<script lang="ts">
  type Props = {
    value: number;
    onChange?: (value: number) => void;
  };

  let { value, onChange = () => {} }: Props = $props();
  let isHovered = $state(false);
  let isOpen = $state(false);

  const percentValue = $derived(Math.round(value * 100));

  function handleInput(event: Event): void {
    const rawValue = Number((event.currentTarget as HTMLInputElement).value);
    onChange(rawValue / 100);
  }

  function handleToggle(): void {
    isOpen = !isOpen;
  }

  function handleMouseEnter(): void {
    isHovered = true;
  }

  function handleMouseLeave(): void {
    isHovered = false;
    isOpen = false;
  }
</script>

<section
  aria-label="Buzzer volume control"
  class="buzz-volume"
  role="group"
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
>
  <button
    type="button"
    class="buzz-volume__toggle"
    class:buzz-volume__toggle--hovered={isHovered || isOpen}
    aria-label="Toggle buzzer volume"
    aria-expanded={isOpen}
    onclick={handleToggle}
  >
    <span aria-hidden="true" class="buzz-volume__icon">🔊</span>
  </button>

  {#if isOpen}
    <div class="buzz-volume__panel">
      <label class="buzz-volume__label" for="buzz-volume-slider">Buzzer volume</label>
      <div class="buzz-volume__row">
        <input
          id="buzz-volume-slider"
          class="buzz-volume__slider"
          type="range"
          min="0"
          max="100"
          step="1"
          value={percentValue}
          aria-label="Buzzer volume"
          oninput={handleInput}
        />
        <span class="buzz-volume__value">Buzzer volume {percentValue}%</span>
      </div>
    </div>
  {/if}
</section>

<style>
  .buzz-volume {
    position: fixed;
    top: 0.75rem;
    right: 0.75rem;
    z-index: 20;
    display: grid;
    justify-items: end;
    box-sizing: border-box;
  }

  .buzz-volume__toggle {
    border: 2px solid #0f2d52;
    background: rgb(15 41 68 / 0.92);
    color: #eff6ff;
    box-shadow: 0 8px 20px rgb(15 23 42 / 0.25);
    border-radius: 0;
    width: 3rem;
    height: 3rem;
    display: grid;
    place-items: center;
    cursor: pointer;
    opacity: 0.5;
    transition:
      opacity 120ms ease,
      background-color 120ms ease;
  }

  .buzz-volume__toggle--hovered {
    opacity: 1;
  }

  .buzz-volume__toggle:focus-visible {
    opacity: 1;
    outline: 2px solid #facc15;
    outline-offset: 2px;
  }

  .buzz-volume__icon {
    font-size: 1.3rem;
    line-height: 1;
  }

  .buzz-volume__panel {
    margin-top: 0.45rem;
    display: grid;
    gap: 0.35rem;
    padding: 0.65rem 0.75rem;
    border: 2px solid #0f2d52;
    background: rgb(15 41 68 / 0.92);
    color: #eff6ff;
    box-shadow: 0 8px 20px rgb(15 23 42 / 0.25);
    border-radius: 0;
    min-width: min(18rem, calc(100vw - 1.5rem));
    box-sizing: border-box;
  }

  .buzz-volume__label {
    font-size: 0.85rem;
    font-weight: 800;
    line-height: 1.1;
  }

  .buzz-volume__row {
    display: grid;
    gap: 0.35rem;
  }

  .buzz-volume__slider {
    width: 100%;
    margin: 0;
  }

  .buzz-volume__value {
    font-size: 0.85rem;
    line-height: 1.1;
    font-weight: 700;
  }

  @media (max-width: 720px) {
    .buzz-volume__panel {
      min-width: auto;
    }
  }
</style>
