import type { HostingMode } from "src/realtime/client";

function buildJoinUrl(
  origin: string,
  joinCode: string,
  mode: HostingMode,
  basePath = import.meta.env.BASE_URL,
): string {
  const query = new URLSearchParams({
    code: joinCode,
    mode,
  });

  return `${origin}${buildBaseAwarePath("/join", basePath)}?${query.toString()}`;
}

function buildPlayerPath(
  joinCode: string,
  displayName: string,
  mode: HostingMode,

  basePath = import.meta.env.BASE_URL,
): string {
  const query = new URLSearchParams({
    code: joinCode,
    name: displayName,
    mode,
  });

  return `${buildBaseAwarePath("/player", basePath)}?${query.toString()}`;
}

function getSearchParam(search: string, key: string): string {
  return new URLSearchParams(search).get(key) ?? "";
}

function resolveRoutePath(
  pathname: string,
  basePath = import.meta.env.BASE_URL,
): "/" | "/join" | "/player" | "*" {
  const normalizedPathname = stripBasePath(pathname, basePath);

  if (normalizedPathname === "/") {
    return "/";
  }

  if (normalizedPathname === "/join") {
    return "/join";
  }

  if (normalizedPathname === "/player") {
    return "/player";
  }

  return "*";
}

function buildBaseAwarePath(pathname: "/join" | "/player", basePath: string): string {
  const normalizedBasePath = normalizeBasePath(basePath);

  if (normalizedBasePath === "/") {
    return pathname;
  }

  return `${normalizedBasePath.slice(0, -1)}${pathname}`;
}

function stripBasePath(pathname: string, basePath: string): string {
  const normalizedBasePath = normalizeBasePath(basePath);

  if (normalizedBasePath === "/") {
    return pathname;
  }

  if (pathname === normalizedBasePath.slice(0, -1)) {
    return "/";
  }

  if (pathname.startsWith(normalizedBasePath)) {
    return pathname.slice(normalizedBasePath.length - 1);
  }

  return pathname;
}

function normalizeBasePath(basePath: string): string {
  const trimmedBasePath = basePath.trim();

  if (trimmedBasePath.length === 0 || trimmedBasePath === "/") {
    return "/";
  }

  const withLeadingSlash = trimmedBasePath.startsWith("/")
    ? trimmedBasePath
    : `/${trimmedBasePath}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}

export { buildJoinUrl, buildPlayerPath, getSearchParam, resolveRoutePath };
