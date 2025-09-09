import { Assets, Spritesheet } from 'pixi.js'

export type AssetsKeys = 'BLOCKS' | 'PLAYER' | 'VEGETATION' | 'ANIMALS'
export const ASSETS: Partial<Record<AssetsKeys, Spritesheet>> = {}

export type AudioKeys = 'WALK' | 'SWIM'
export const AUDIO: Partial<Record<AudioKeys, HTMLAudioElement[]>> = {}

export const loadAllinitialAssets = async () => {
	// Add assets with explicit aliases
	Assets.add({ alias: 'blocks', src: '/game/blocks.json' })
	Assets.add({ alias: 'vegetation', src: '/game/vegetation.json' })
	Assets.add({ alias: 'player', src: '/game/character/player.json' })
	Assets.add({ alias: 'animals', src: '/game/animals.json' })
	
	// Load the assets
	ASSETS.BLOCKS = await Assets.load('blocks')
	ASSETS.VEGETATION = await Assets.load('vegetation')
	ASSETS.PLAYER = await Assets.load('player')
	ASSETS.ANIMALS = await Assets.load('animals')

	AUDIO.WALK = [
		new Audio('/sound/step-1.mp3'),
		new Audio('/sound/step-2.mp3'),
		new Audio('/sound/step-3.mp3')
	]
	AUDIO.SWIM = [new Audio('/sound/swim-1.mp3'), new Audio('/sound/swim-2.mp3')]
}
