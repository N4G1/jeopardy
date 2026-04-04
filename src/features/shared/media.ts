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

function isSupportedImageFile(file: Pick<File, "type">): boolean {
  return supportedImageMimeTypes.has(file.type);
}

function isSupportedAudioFile(file: Pick<File, "type">): boolean {
  return supportedAudioMimeTypes.has(file.type);
}

function isSupportedVideoFile(file: Pick<File, "type">): boolean {
  return supportedVideoMimeTypes.has(file.type);
}

function isSupportedClueMediaFile(file: Pick<File, "type">): boolean {
  return isSupportedImageFile(file) || isSupportedAudioFile(file) || isSupportedVideoFile(file);
}

function getClueMediaKind(file: Pick<File, "type">): ClueMedia["kind"] | undefined {
  if (isSupportedImageFile(file)) {
    return "image";
  }
  if (isSupportedAudioFile(file)) {
    return "audio";
  }
  if (isSupportedVideoFile(file)) {
    return "video";
  }
  return undefined;
}

function readImageFileAsClueMedia(file: File): Promise<ClueMedia> {
  return readFileAsClueMedia(file);
}

function readFileAsClueMedia(file: File): Promise<ClueMedia> {
  return new Promise((resolve, reject) => {
    const kind = getClueMediaKind(file);

    if (kind === undefined) {
      reject(new Error("Failed to read media file."));
      return;
    }

    const reader = new FileReader();

    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Failed to read media file."));
        return;
      }

      if (kind === "image") {
        resolve({
          kind,
          fileName: file.name,
          url: reader.result,
          altText: file.name,
        });
        return;
      }

      resolve({
        kind,
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
