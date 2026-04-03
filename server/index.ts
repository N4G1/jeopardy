import { createServer } from "node:http";

import { createJeopardyWebSocketServer } from "./realtime/websocketServer.js";
import { createDefaultSessionStore } from "./session/sessionStore.js";

const host = "0.0.0.0";
const port = Number(process.env.PORT ?? "3001");

const server = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ status: "ok" }));
    return;
  }

  response.writeHead(200, { "content-type": "application/json" });
  response.end(
    JSON.stringify({
      message: "Jeopardy server scaffold is running.",
    }),
  );
});

createJeopardyWebSocketServer({
  server,
  sessionStore: createDefaultSessionStore(),
});

server.listen(port, host, () => {
  console.log(`Jeopardy server scaffold listening on http://${host}:${port}`);
});
