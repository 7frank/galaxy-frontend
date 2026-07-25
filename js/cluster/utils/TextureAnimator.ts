import { RepeatWrapping } from "three/src/constants.js";
import type { Texture } from "three/src/textures/Texture.js";

export default class TextureAnimator {
    tilesHorizontal: number
    tilesVertical: number
    numberOfTiles: number
    tileDisplayDuration: number
    currentDisplayTime: number
    currentTile: number
    private texture: Texture

    constructor(texture: Texture, tilesHoriz: number, tilesVert: number, numTiles: number, tileDispDuration: number) {
        this.texture = texture;
        this.tilesHorizontal = tilesHoriz;
        this.tilesVertical = tilesVert;
        this.numberOfTiles = numTiles;
        texture.wrapS = texture.wrapT = RepeatWrapping;
        texture.repeat.set(1 / this.tilesHorizontal, 1 / this.tilesVertical);
        this.tileDisplayDuration = tileDispDuration;
        this.currentDisplayTime = 0;
        this.currentTile = 0;
    }

    update(milliSec: number): void {
        this.currentDisplayTime += milliSec;
        while (this.currentDisplayTime > this.tileDisplayDuration) {
            this.currentDisplayTime -= this.tileDisplayDuration;
            this.currentTile++;
            if (this.currentTile == this.numberOfTiles)
                this.currentTile = 0;
            const currentColumn = this.currentTile % this.tilesHorizontal;
            this.texture.offset.x = currentColumn / this.tilesHorizontal;
            const currentRow = Math.floor(this.currentTile / this.tilesHorizontal);
            this.texture.offset.y = currentRow / this.tilesVertical;
        }
    }
}
