import { createServer } from "node:http";

import { WebSocketServer } from "ws";
import type WebSocket from "ws";

const host = "0.0.0.0";
const port = 3001;

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

const websocketServer = new WebSocketServer({ server });

websocketServer.on("connection", (socket: WebSocket) => {
  socket.send(
    JSON.stringify({
      type: "server_ready",
    }),
  );
});

server.listen(port, host, () => {
  console.log(`Jeopardy server scaffold listening on http://${host}:${port}`);
});
