import { GameState, Player } from './types.js'

type ConnectionsMap = Map<string, Player>
type WaitingPlayersMap = Map<string, Player>
type GamesMap = Map<string, GameState>

const listTimestamp = (): void => {
  const timestamp = new Date().toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  })

  console.log('******************************************')
  console.log('******************************************')
  console.log('******************************************')
  console.log('------------- Timestamp ---------------')
  console.log('Timestamp:', timestamp)
}

const listConnections = (connections: ConnectionsMap): void => {
  const connectionsArray = [...connections.values()]
  console.log('------------- Connections ---------------')
  console.log('connectionsArray.length', connectionsArray.length)
  connectionsArray.forEach((player, i) => {
    console.log(`Connection:${i} = ${player.id} gameId=${player.gameId}`)
  })
  console.log('  ')
}

const listWaitingPlayers = (waitingPlayers: WaitingPlayersMap): void => {
  const waitingPlayersArray = [...waitingPlayers.values()]
  console.log('------------- Waiting Players ---------------')
  console.log('waitingPlayersArray.length', waitingPlayersArray.length)
  waitingPlayersArray.forEach((player, i) => {
    console.log(`Waiting Player:${i} = ${player.id}`)
  })
  console.log('  ')
}

const listGames = (games: GamesMap) => {
  const gamesArray = [...games.values()]
  console.log('------------- Games ---------------')
  console.log('gamesArray.length', gamesArray.length)
  gamesArray.forEach((game, i) => {
    console.log(`Game:${i} = ${game.playerX?.id} vs ${game.playerO?.id}`)
  })
  console.log('  ')
}

const listGameBoards = (games: GamesMap) => {
  const gamesArray = [...games.values()]
  console.log('------------- Game Boards---------------')
  console.log('gamesArray.length', gamesArray.length)
  gamesArray.forEach((game, i) => {
    console.log(`Game:${game.gameId} = ${game.board} `)
    console.log('game.status', game.status)
    console.log('game.gameMessage', game.gameMessage)
    console.log('game.result', game.result)
  })
  console.log('  ')
}

const listDeadConnections = (connections: ConnectionsMap): void => {
  const connectionsArray = [...connections.values()].filter(
    (player) => !player.isAlive,
  )
  console.log('------------- Dead Connections ---------------')
  console.log('connectionsArray.length', connectionsArray.length)
  connectionsArray.forEach((player, i) => {
    console.log(`Connection:${i} = ${player.id} gameId=${player.isAlive}`)
  })
  console.log('  ')
}

const listResultState = (games: GamesMap): void => {
  const gamesArray = [...games.values()]
  console.log('------------- Game Result ---------------')
  console.log('gamesArray.length', gamesArray.length)
  gamesArray.forEach((game, i) => {
    console.log(`Game has result :${i} = ${game.result} `)
  })
  console.log('  ')
}

type StartGamePollingInput = {
  connections: ConnectionsMap
  waitingPlayers: WaitingPlayersMap
  games: GamesMap
}

export const startGameLogging = ({
  connections,
  waitingPlayers,
  games,
}: StartGamePollingInput) => {
  setInterval(listTimestamp, 5000)
  setInterval(() => listConnections(connections), 5000)
  setInterval(() => listWaitingPlayers(waitingPlayers), 5000)
  setInterval(() => listGames(games), 5000)
  setInterval(() => listDeadConnections(connections), 5000)
  setInterval(() => listGameBoards(games), 5000)
  setInterval(() => listResultState(games), 5000)
}
