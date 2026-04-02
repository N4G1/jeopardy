import type { ClueMedia } from "src/features/setup/boardSchema";

const supportedImageMimeTypes = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

function isSupportedImageFile(file: Pick<File, "type">): boolean {
  return supportedImageMimeTypes.has(file.type);
}

function readImageFileAsClueMedia(file: File): Promise<ClueMedia> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Failed to read image file."));
        return;
      }

      resolve({
        kind: "image",
        fileName: file.name,
        url: reader.result,
        altText: file.name,
      });
    });

    reader.addEventListener("error", () => {
      reject(new Error("Failed to read image file."));
    });

    reader.readAsDataURL(file);
  });
}

export { isSupportedImageFile, readImageFileAsClueMedia };
