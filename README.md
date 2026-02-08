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

## Build & run

```bash
npm run build
npm start
```

## Environment variables

- `PORT` (optional): WebSocket server port. Default: `8081`.
- `NODE_ENV` (optional): Set to `production` to disable verbose game logging.

## WebSocket API

All messages are JSON.

## Frontend integration

### 1) Create WebSocket connection

```ts
const ws = new WebSocket('ws://localhost:8081')
```

### 2) To start game

```ts
ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'START_GAME', payload: {} }))
}
```

**Example JSON response after start game request**

```json
{
  "type": "GAME_STATE",
  "status": "WAITING_FOR_OPPONENT",
  "gameId": null,
  "playerSymbol": null,
  "board": [null, null, null, null, null, null, null, null, null],
  "currentTurn": "X",
  "result": null,
  "connectionLostTimestamp": null,
  "gameMessage": "Waiting for opponent to join..."
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

**Example JSON response after board update**

```json
{
  "type": "UPDATE_BOARD",
  "board": ["X", null, null, null, null, null, null, null, null],
  "currentTurn": "O",
  "error": null,
  "result": null,
  "gameMessage": "Waiting for opponent's move..."
}
```

**Example JSON response after game complete**

```json
{
  "type": "SET_RESULT",
  "status": "COMPLETED",
  "error": null,
  "result": "X",
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
