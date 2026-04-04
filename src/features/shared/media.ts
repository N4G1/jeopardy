import type { ClueMedia } from "src/features/setup/boardSchema";

const supportedImageMimeTypes = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);
const supportedAudioMimeTypes = new Set([
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
]);
const supportedVideoMimeTypes = new Set([
  "video/mp4",
  "video/ogg",
  "video/quicktime",
  "video/webm",
]);

function getInferredMimeType(
  file: Pick<File, "type" | "name">,
): { kind: ClueMedia["kind"]; mimeType: string } | undefined {
  if (supportedImageMimeTypes.has(file.type)) {
    return { kind: "image", mimeType: file.type };
  }

  if (supportedAudioMimeTypes.has(file.type)) {
    return { kind: "audio", mimeType: file.type };
  }

  if (supportedVideoMimeTypes.has(file.type)) {
    return { kind: "video", mimeType: file.type };
  }

  return undefined;
}

function isSupportedImageFile(file: Pick<File, "type" | "name">): boolean {
  return getInferredMimeType(file)?.kind === "image";
}

function isSupportedAudioFile(file: Pick<File, "type" | "name">): boolean {
  return getInferredMimeType(file)?.kind === "audio";
}

function isSupportedVideoFile(file: Pick<File, "type" | "name">): boolean {
  return getInferredMimeType(file)?.kind === "video";
}

function isSupportedClueMediaFile(file: Pick<File, "type" | "name">): boolean {
  return getInferredMimeType(file) !== undefined;
}

function readImageFileAsClueMedia(file: File): Promise<ClueMedia> {
  return readFileAsClueMedia(file);
}

function readFileAsClueMedia(file: File): Promise<ClueMedia> {
  return new Promise((resolve, reject) => {
    const inferredMime = getInferredMimeType(file);

    if (inferredMime === undefined) {
      reject(new Error("Failed to read media file."));
      return;
    }

    const reader = new FileReader();

    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Failed to read media file."));
        return;
      }

      if (inferredMime.kind === "image") {
        resolve({
          kind: inferredMime.kind,
          fileName: file.name,
          url: reader.result,
          altText: file.name,
        });
        return;
      }

      resolve({
        kind: inferredMime.kind,
        fileName: file.name,
        url: reader.result,
      });
    });

    reader.addEventListener("error", () => {
      reject(new Error("Failed to read media file."));
    });

    reader.readAsDataURL(file);
  });
}

export {
  isSupportedAudioFile,
  isSupportedClueMediaFile,
  isSupportedImageFile,
  isSupportedVideoFile,
  readFileAsClueMedia,
  readImageFileAsClueMedia,
};
