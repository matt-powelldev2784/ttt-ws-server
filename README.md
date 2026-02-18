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
    // setup function to handle incoming messages and update game state
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

### 3) Handle server messages

The server sends a game state update on every relevant event : connection, opponent found, move made and game result. The message shape is consistent on every update, so the frontend can simply update local game state with the server response.

```ts
type GameState = {
  type: 'GAME_STATE' | 'UPDATE_BOARD' | 'SET_RESULT'
  status:
    | 'NOT_CONNECTED'
    | 'CONNECTED'
    | 'WAITING_FOR_OPPONENT'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CONNECTION_LOST'
  gameId: string | null
  playerSymbol: 'X' | 'O' | null
  board: [
    'X' | 'O' | null,
    'X' | 'O' | null,
    'X' | 'O' | null,
    'X' | 'O' | null,
    'X' | 'O' | null,
    'X' | 'O' | null,
    'X' | 'O' | null,
    'X' | 'O' | null,
    'X' | 'O' | null,
  ]
  currentTurn: 'X' | 'O'
  result: 'X' | 'O' | 'DRAW' | null
  error?: string | null
  connectionLostTimestamp: number | null
  gameMessage: string | null
}

const handleMessage = (event: MessageEvent) => {
  const payload = JSON.parse(event.data) as GameState
  setGameState(payload)
}
```

**Example JSON response (same shape on every update):**

```json
{
  "type": "UPDATE_BOARD",
  "status": "IN_PROGRESS",
  "gameId": "game-123",
  "playerSymbol": "O",
  "board": ["X", null, null, null, null, null, null, null, null],
  "currentTurn": "O",
  "result": null,
  "error": null,
  "connectionLostTimestamp": null,
  "gameMessage": "It's your turn!"
}
```

### 4) Send a move

```ts
const makeMoveMessage = JSON.stringify({
  type: 'MAKE_MOVE',
  payload: { gameId, index, symbol },
})

sendMessage(makeMoveMessage)
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
