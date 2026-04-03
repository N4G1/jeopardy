<script lang="ts">
  type ToastTone = "info" | "success" | "error";

  type Props = {
    message: string;
    tone?: ToastTone;
    onDismiss?: () => void;
  };

  let { message, tone = "info", onDismiss = () => {} }: Props = $props();
</script>

{#if message.length > 0}
  <div
    class="timed-toast"
    class:timed-toast--success={tone === "success"}
    class:timed-toast--error={tone === "error"}
    role="status"
    aria-live="polite"
  >
    <p>{message}</p>
    <button type="button" aria-label="Dismiss message" onclick={onDismiss}>x</button>
  </div>
{/if}

<style>
  .timed-toast {
    position: fixed;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    width: min(48rem, calc(100vw - 2rem));
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    box-sizing: border-box;
    padding: 0.75rem 0.9rem;
    border: 2px solid #2563eb;
    background: #0f172a;
    color: #e2e8f0;
    box-shadow: 0 10px 20px rgb(2 6 23 / 0.4);
  }

  .timed-toast--success {
    border-color: #16a34a;
    background: #022c22;
    color: #dcfce7;
  }

  .timed-toast--error {
    border-color: #ef4444;
    background: #3f0d11;
    color: #fee2e2;
  }

  .timed-toast p {
    margin: 0;
    font-weight: 700;
    line-height: 1.2;
  }

  .timed-toast button {
    border: 1px solid #64748b;
    background: #0b1120;
    color: inherit;
    cursor: pointer;
    font: inherit;
    font-weight: 800;
    line-height: 1;
    width: 1.75rem;
    height: 1.75rem;
    flex: 0 0 auto;
  }
</style>
