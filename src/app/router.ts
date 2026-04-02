import type { WrappedComponent } from "svelte-spa-router";

import HostGameScreen from "../features/host/HostGameScreen.svelte";
import JoinScreen from "../features/player/JoinScreen.svelte";
import PlayerBoardScreen from "../features/player/PlayerBoardScreen.svelte";
import NotFoundScreen from "../features/shared/NotFoundScreen.svelte";

type RouteTable = Record<string, WrappedComponent>;

const routes: RouteTable = {
  "/": HostGameScreen,
  "/join": JoinScreen,
  "/player": PlayerBoardScreen,
  "*": NotFoundScreen,
};

export { routes };
