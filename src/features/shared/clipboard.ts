async function copyTextToClipboard(text: string): Promise<void> {
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard !== undefined &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard is not available.");
  }

  const temporaryTextArea = document.createElement("textarea");
  temporaryTextArea.value = text;
  temporaryTextArea.setAttribute("readonly", "");
  temporaryTextArea.style.position = "absolute";
  temporaryTextArea.style.left = "-9999px";

  document.body.append(temporaryTextArea);
  temporaryTextArea.select();

  const wasCopied = document.execCommand("copy");

  temporaryTextArea.remove();

  if (!wasCopied) {
    throw new Error("Clipboard copy failed.");
  }
}

export { copyTextToClipboard };
