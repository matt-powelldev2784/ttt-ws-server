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

## Run development server

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Run production server

```bash
npm run start
```

## WebSocket API Frontend Setup

### 1) Create WebSocket connection

Setup websocket connection when the app loads and create message handler to
update local game state based on server responses.

```ts
const socketRef = useRef<WebSocket | null>(null)
const serverUrl = 'ws://localhost:8081/ws'

// connect to server and set up message handler
useEffect(() => {
  if (socketRef.current) {
    return
  }

  const socket = new WebSocket(serverUrl)
  socketRef.current = socket

  const handleMessage = (event: MessageEvent) => {
    //setup function to handle incoming messages and update game state
    handleSocketMessage({ event, setGameState(payload) })
  }

  socket.addEventListener('message', handleMessage)

  return () => {
    socket.removeEventListener('message', handleMessage)
    socket.close()
    socketRef.current = null
  }
}, [])
```

### 2) To start game

Setup function to send start game message to server. Server will match player
with opponent and respond with initial game state.

```ts
const sendMessage = (message: string) => {
  const socket = socketRef.current
  if (!socket) {
    return
  }

  if (socket.readyState !== WebSocket.OPEN) {
    socket.addEventListener('open', () => socket.send(message), {
      once: true,
    })
    return
  }

  socket.send(message)
}

const startGameMessage = JSON.stringify({ type: 'START_GAME', payload: {} }))
sendMessage(startGameMessage)
```

### 3) Handle server messages based on 3 types:

**'GAME_STATE'**

Update game state with server response

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

**'UPDATE_BOARD'**

Update board and current turn state after opponent move

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

**'SET_RESULT'**

Update game state with final result after game completion

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

### 4) Send a move

```ts
const makeMoveMessage = JSON.stringify({
  type: 'MAKE_MOVE',
  payload: { gameId, index, symbol },
})

sendMessage(startGameMessage)
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
