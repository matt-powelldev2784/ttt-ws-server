# Tic-Tac-Toe WebSocket Server

A Node.js + TypeScript WebSocket server for real-time tic‑tac‑toe. Manages
player connections, matchmaking, game state, and heartbeat cleanup.

## Requirements

- Node.js 18+
- npm

## Install

```bash
npm install
```

## Run (dev)

```bash
npm run dev
```

## Build & run (production)

```bash
npm run build
npm start
```

## Environment variables

- `PORT` (optional): WebSocket server port. Default: `8081`.
- `NODE_ENV` (optional): Set to `production` to disable verbose game logging.

## WebSocket API

All messages are JSON.

## Frontend integration (minimal)

### 1) Connect

```ts
const ws = new WebSocket('ws://localhost:8081')
```

### 2) Join matchmaking (on open)

```ts
ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'START_GAME' }))
}
```

### 3) Handle server messages

```ts
ws.onmessage = (event) => {
  const message = JSON.parse(event.data)

  if (message.type === 'GAME_STATE') {
    // full state update
    // status, gameId, playerSymbol, board, currentTurn, error, gameMessage
  }

  if (message.type === 'UPDATE_BOARD') {
    // board + turn only
    // board, currentTurn, error, result
  }

  if (message.type === 'SET_RESULT') {
    // end of game
    // result, gameMessage
  }
}
```

### 4) Send a move

```ts
ws.send(
  JSON.stringify({
    type: 'MAKE_MOVE',
    payload: { gameId, index, symbol },
  }),
)
```

### Client → Server

**Start matchmaking**

```json
{ "type": "START_GAME" }
```

**Make a move**

```json
{
  "type": "MAKE_MOVE",
  "payload": {
    "gameId": "game-...",
    "index": 0,
    "symbol": "X"
  }
}
```

### Server → Client

**Initial / state updates**

```json
{
  "type": "GAME_STATE",
  "status": "CONNECTED" | "WAITING_FOR_OPPONENT" | "IN_PROGRESS" | "COMPLETED" | "CONNECTION_LOST",
  "gameId": "game-..." | null,
  "playerSymbol": "X" | "O" | null,
  "board": [null, null, null, null, null, null, null, null, null],
  "currentTurn": "X" | "O",
  "result": "X" | "O" | "DRAW" | null,
  "error": string | null,
  "gameMessage": string | null
}
```

**Board updates**

```json
{
  "type": "UPDATE_BOARD",
  "board": ["X", null, ...],
  "currentTurn": "O",
  "error": null,
  "result": null
}
```

**Game result**

```json
{
  "type": "SET_RESULT",
  "status": "COMPLETED",
  "result": "X" | "O" | "DRAW",
  "error": null,
  "gameMessage": "Player X wins!"
}
```

## Notes

- The server uses a heartbeat to detect dead connections and clean up state.
- Boards are 1D arrays of length 9 (indexes 0–8).

## Project structure

- `server.ts`: WebSocket server entry point
- `gameState.ts`: Game state helpers and updates
- `playerState.ts`: Player queue / cleanup logic
- `gameLogging.ts`: Development logging utilities
- `types.ts`: Shared TypeScript types
