import { Game, Player } from './types.js'

type ConnectionsMap = Map<string, Player>
type WaitingPlayersMap = Map<string, Player>
type GamesMap = Map<string, Game>

const listConnections = (connections: ConnectionsMap): void => {
  const connectionsArray = [...connections.values()]
  console.log('***********')
  console.log('***********')
  console.log('***********')
  console.log('------------- Connections ---------------')
  console.log('connectionsArray.length', connectionsArray.length)
  connectionsArray.forEach((player, i) => {
    console.log(`Connection:${i} = ${player.id} gameId=${player.gameId}`)
  })
}

const listWaitingPlayers = (waitingPlayers: WaitingPlayersMap): void => {
  const waitingPlayersArray = [...waitingPlayers.values()]
  console.log('***********')
  console.log('***********')
  console.log('***********')
  console.log('------------- Waiting Players ---------------')
  console.log('waitingPlayersArray.length', waitingPlayersArray.length)
  waitingPlayersArray.forEach((player, i) => {
    console.log(`Waiting Player:${i} = ${player.id}`)
  })
}

const listGames = (games: GamesMap) => {
  const gamesArray = [...games.values()]
  console.log('***********')
  console.log('***********')
  console.log('***********')
  console.log('------------- Games ---------------')
  console.log('gamesArray.length', gamesArray.length)
  gamesArray.forEach((game, i) => {
    console.log(`Game:${i} = ${game.playerX.id} vs ${game.playerO.id}`)
  })
}

type StartGamePollingInput = {
  connections: ConnectionsMap
  waitingPlayers: WaitingPlayersMap
  games: GamesMap
}

export const startGamePolling = ({
  connections,
  waitingPlayers,
  games,
}: StartGamePollingInput) => {
  setInterval(() => listConnections(connections), 5000)
  setInterval(() => listWaitingPlayers(waitingPlayers), 5000)
  setInterval(() => listGames(games), 5000)
}
