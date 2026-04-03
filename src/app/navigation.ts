function buildJoinUrl(origin: string, joinCode: string): string {
  return `${origin}/join?code=${joinCode}`;
}

function buildPlayerPath(joinCode: string, displayName: string): string {
  const query = new URLSearchParams({
    code: joinCode,
    name: displayName,
  });

  return `/player?${query.toString()}`;
}

function getSearchParam(search: string, key: string): string {
  return new URLSearchParams(search).get(key) ?? "";
}

function resolveRoutePath(pathname: string): "/" | "/join" | "/player" | "*" {
  if (pathname === "/") {
    return "/";
  }

  if (pathname === "/join") {
    return "/join";
  }

  if (pathname === "/player") {
    return "/player";
  }

  return "*";
}

export { buildJoinUrl, buildPlayerPath, getSearchParam, resolveRoutePath };
