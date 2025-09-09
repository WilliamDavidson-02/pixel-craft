import { Application, Container, Culler, Rectangle } from 'pixi.js'
import {
	chunkCreationList,
	createChunk,
	setInitalTiles,
	setNewChunksToRender,
	setRenderDistance,
	updateVisibleChunks
} from './core/tiles'
import { loadAllinitialAssets } from './core/assets'
import {
	createPlayer,
	isPlayerMoving,
	isPlayerStopping,
	movePlayerPosition,
	putPlayerInChunk,
	registerPlayerMovement,
	removePlayerMovement,
	setPlayerAnimation
} from './core/player'
import { spawnAnimals, updateAllAnimals } from './core/animals'
import { handleWindowResize } from './lib/utils/window'

let view = new Rectangle(0, 0, window.innerWidth, window.innerHeight)

const init = async () => {
	const app = new Application()
	await app.init({
		resizeTo: window,
		antialias: false,
		background: '#4a80ff'
	})
	document.body.appendChild(app.canvas)
	// @ts-ignore
	globalThis.__PIXI_APP__ = app

	setRenderDistance()
	await loadAllinitialAssets()

	const world = new Container({
		isRenderGroup: true,
		eventMode: 'static',
		label: 'world'
	})

	app.stage.addChild(world)

	const surface = new Container({ label: 'surface' })

	const ground = new Container({ label: 'ground' })
	setInitalTiles(world, ground, surface)
	world.addChild(ground, surface)

	const player = createPlayer(world)
	putPlayerInChunk(player)
	
	// Spawn 200 wolves across a large area
	spawnAnimals(world, 200)
	
	window.addEventListener('keydown', (ev) => registerPlayerMovement(ev.key))
	window.addEventListener('keyup', (ev) => removePlayerMovement(ev.key))

	app.ticker.add((ticker) => {
		if (isPlayerMoving()) {
			movePlayerPosition(player, world, ticker)
			setNewChunksToRender(world)

			if (chunkCreationList.length > 0) {
				createChunk(chunkCreationList[0])
			}

			updateVisibleChunks(world, ground, surface)
		} else if (isPlayerStopping()) {
			setPlayerAnimation(player, null, 0)
		}

		// Update all animals every frame
		updateAllAnimals(ticker)

		Culler.shared.cull(world, view)
	})

	window.addEventListener('resize', () => {
		handleWindowResize(world, ground, surface)

		view = new Rectangle(0, 0, window.innerWidth, window.innerHeight)
	})
}

window.addEventListener('DOMContentLoaded', init)
