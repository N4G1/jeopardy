import HostGameScreen from "../features/host/HostGameScreen.svelte";
import JoinScreen from "../features/player/JoinScreen.svelte";
import PlayerBoardScreen from "../features/player/PlayerBoardScreen.svelte";
import NotFoundScreen from "../features/shared/NotFoundScreen.svelte";

const routes = {
  "/": HostGameScreen,
  "/join": JoinScreen,
  "/player": PlayerBoardScreen,
  "*": NotFoundScreen,
};

export { routes };
