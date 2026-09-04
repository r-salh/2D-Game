class Overworld {
    #player;
    #camera;
    #mapManager;

    constructor(ctx) {
        this.#player = new Player();
    
        this.#camera = new Camera();
        this.#camera.setFollowing(this.#player);

        const callback = () => {
            this.#camera.setLimits(
                this.#mapManager.getLevelWidth(),
                this.#mapManager.getLevelHeight(),
            );
        }

        this.#mapManager = new MapManager();
        this.#mapManager.loadMap(MapManager.World1, ctx, callback);
    }

    update(deltaT) {
        this.#player.update(deltaT);
        this.#camera.update();
    }

    draw(ctx) {
        this.#mapManager.draw(ctx, this.#camera);
        this.#player.draw(ctx, this.#camera);
    }

    keyUp(key) {
        this.#player.keyUp(key);
    }

    keyDown(key) {
        this.#player.keyDown(key);
    }
}

class MapManager {
    static World1 = "world_1";

    #currentMap;

    #mapWidth;
    #mapHeight;

    #mapTileWidth;
    #mapTileHeight;

    #tile;
    #numTiles = 18;

    constructor() {

        // Load tiles
        this.#tile = [];
        for (let i = 0; i < this.#numTiles; i++) {
            const newImg = new Image();
            newImg.src = `art/tile/${i}.png`;
            this.#tile.push(newImg);
        }
    }

    loadMap(level, ctx, callback = null) {
        this.#currentMap = [];

        const filename = "level/" + level + ".png";

        const mapImg = new Image();
        mapImg.src = filename;

        // Convert map PNG image into array
        mapImg.onload = () => {
            this.#mapTileWidth = mapImg.width;
            this.#mapTileHeight = mapImg.height;
            this.#mapWidth = mapImg.width * Game.TileSize;
            this.#mapHeight = mapImg.height * Game.TileSize;

            ctx.drawImage(mapImg, 0, 0, mapImg.width, mapImg.height);

            for (let j = 0; j < mapImg.height; j++) {
                const row = [];

                for (let i = 0; i < mapImg.width; i++) {
                    const imgData = ctx.getImageData(j, i, 1, 1);
                    const rgb = imgData.data;
                    let red = rgb[0];
                    if (red >= this.#numTiles) {
                        red = 0;
                    }
                    row.push(red);
                }

                this.#currentMap.push(row);
            }

            if (typeof callback === "function") { callback() }
        };
        
    }

    draw(ctx, camera) {
        const xTile = camera.getTileX();
        const yTile = camera.getTileY();

        let screenX = xTile * Game.TileSize - camera.getX();
        let screenY = yTile * Game.TileSize - camera.getY();

        for (let j = yTile; j < (yTile + Game.TilesInHeight + 1) && j < (this.#mapTileHeight); j++) {
            for (let i = xTile; i < (xTile + Game.TilesInWidth + 1) && (i < this.#mapTileWidth); i++) {
                let tileType = this.#currentMap[i][j];

                ctx.drawImage(this.#tile[tileType], screenX, screenY, Game.TileSize, Game.TileSize);

                screenX += Game.TileSize;
            }

            screenX = xTile * Game.TileSize - camera.getX();
            screenY += Game.TileSize;
        }
    }

    getLevelWidth() {
        return this.#mapWidth;
    }

    getLevelHeight() {
        return this.#mapHeight;
    }
}

class Camera {
    #leftBorder = Math.floor(0.2 * Game.CanvasWidth);
    #rightBorder = Math.floor(0.8 * Game.CanvasWidth);
    #topBorder = Math.floor(0.2 * Game.CanvasHeight);
    #bottomBorder = Math.floor(0.8 * Game.CanvasHeight);

    #cameraX = 0;
    #cameraY = 0;

    #following;

    #maxRight;
    #maxDown;

    setLimits(right, down) {
        this.#maxRight = right - Game.CanvasWidth;
        this.#maxDown = down - Game.CanvasHeight;
    }

    setFollowing(following) {
        this.#following = following;
    }

    update() {
        if (typeof this.#following !== "object") {
            return;
        }

        const objectX = Math.floor(this.#following.getX());
        const objectY = Math.floor(this.#following.getY());

        const screenX = objectX - this.#cameraX;
        const screenY = objectY - this.#cameraY;

        if (screenX > this.#rightBorder) {
            this.#cameraX += screenX - this.#rightBorder;

            if (this.#cameraX > this.#maxRight) {
                this.#cameraX = this.#maxRight;
            }

        } else if (screenX < this.#leftBorder) {
            this.#cameraX += screenX - this.#leftBorder;

            if (this.#cameraX < 0) {
                this.#cameraX = 0;
            }
        }

        if (screenY < this.#topBorder) {
            this.#cameraY += screenY - this.#topBorder;

            if (this.#cameraY < 0) {
                this.#cameraY = 0;
            }

        } else if (screenY > this.#bottomBorder) {
            this.#cameraY += screenY - this.#bottomBorder;

            if (this.#cameraY > this.#maxDown) {
                this.#cameraY = this.#maxDown;
            }
        }        
    }

    getX() {
        return this.#cameraX;
    }

    getY() {
        return this.#cameraY;
    }

    getTileX() {
        return Math.floor(this.#cameraX / Game.TileSize);
    }

    getTileY() {
        return Math.floor(this.#cameraY / Game.TileSize);
    }
}