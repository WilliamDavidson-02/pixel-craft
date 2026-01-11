# Pixel Craft

A 2D isometric procedurally generated open world game mode filled with lakes and different types of vegetation like trees grass and flowers

![Pixel craft banner](/public/pixel-craft-banner.png)

## Installation

`Step 1:` Clone and install dependencies

```bash
git clone https://github.com/WilliamDavidson-02/pixel-craft.git
cd pixel-craft
npm install
```

`Step 2:` Run the development server

```bash
npm run dev
```

## Devtools
Pixi.js has a very useful DevTools extension for debugging rendered containers and assets. Install the [extension](https://chromewebstore.google.com/detail/pixijs-devtools/dlkffcaaoccbofklocbjcmppahjjboce) here.

> [!NOTE]
> Pixi dev tools opened may reduce rendering performance when rendering the open world.

## Map generation

There is a chunking system inspired by Minecraft where we have a render distance from where the player is and render all the visible chunks.
Each chunk is 16x16 which contains the tiles for the ground and the surface items i.e vegetation.

Each chunk is procedurally generated and only the visible chunks are actually included in the render tree of pixijs to reduce load on the culling system.

The type of tile that is created is determined by the perlin noise that is generated for each chunk therefore we can have the same map when the chunk is rendered every time.

## Vegetation

The vegetation is created in each chunk but we use a different perlin noise map to generate the area for where the different types of vegetation is going to be.
But since we have a threshold for each type of vegetation the area becomes very compact, therefore we calculate the density of each (x, y) coordinate and determine the probability to render the surface item.
We then have different set of threshold for the density of each vegetation type this makes the vegetation render in the same location and in the same density every time the chunk loads.

## Future development

Currently only the chunk generation, walking and swimming is developed which is a good base for future development we are running 60fps+ on large screens.
More things to develop:

- Inventory
- Crafting
- Harvesting and planting
- Biomes
- Animals
- Main menu to create world and select different seeds
