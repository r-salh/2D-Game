class Overworld {
    static Tutorial = "tutorial";

    static State = {
        Playing: 0,
        Paused: 1,
        Dialogue: 2,
    };

    #party;
    #player;

    #camera;
    #mapManager;
    #dialogueManager;

    #pauseMenu;

    #currentEntities;

    #state = Overworld.State.Playing;

    constructor(party, ctx) {
        this.#party = party;
        this.#player = party.getPlayer();

        // Initialise objects
        this.#camera = new Camera();
        this.#camera.setFollowing(this.#player);

        this.#mapManager = new MapManager();
        this.#dialogueManager = new DialogueManager(
            party.getInventory(),
            ctx
        );

        this.#pauseMenu = new PauseMenu(
            party.getInventory(),
            ctx
        );

        this.loadDungeon(Overworld.Tutorial);
    }

    update(deltaT, ctx) {
        switch (this.#state) {
            case Overworld.State.Paused:
                return;

            case Overworld.State.Dialogue:
                this.#dialogueManager.update(deltaT, ctx);
                break;

            case Overworld.State.Playing:
                this.#party.update(deltaT);
                this.#camera.update();
                
                const playerX = this.#player.getX();
                const playerY = this.#player.getY();

                for (let i in this.#currentEntities) {
                    this.#currentEntities[i].update(playerX, playerY);
                }
                break;
        }
    }

    draw(ctx) {
        this.#mapManager.draw(ctx, this.#camera);
    
        for (let i in this.#currentEntities) {
            this.#currentEntities[i].draw(ctx, this.#camera);
        }

        this.#party.draw(ctx, this.#camera);

        this.#dialogueManager.draw(ctx);
        this.#pauseMenu.draw(ctx);
    }

    keyUp(key) {
        switch (this.#state) {
            case Overworld.State.Paused:
                if (key === Keybind.Menu) {
                    this.#pauseMenu.toggle();
                    this.#state = Overworld.State.Playing;
                    return;
                }
                this.#pauseMenu.keyUp(key);
                break;

            case Overworld.State.Playing:
                if (key === Keybind.Menu) {
                    this.#player.resetBools();
                    this.#pauseMenu.toggle();
                    this.#state = Overworld.State.Paused;
                    return;
                }
                
                if (key === Keybind.Accept) {
                    for (let i in this.#currentEntities) {
                        this.#currentEntities[i].interact();
                    }
                    return;
                }

                this.#player.keyUp(key);
                break;

            case Overworld.State.Dialogue:
                if (key === Keybind.Accept) {
                    this.#dialogueManager.next();
                }
                break;
        }
    }

    keyDown(key) {
        if (this.#state === Overworld.State.Playing) {
            this.#player.keyDown(key);
        }
    }

    loadDungeon(dungeon) {
        const ctx = document.getElementById("game-canvas").getContext("2d");

        const callback = () => {
            this.#camera.setLimits(
                this.#mapManager.getLevelWidth(),
                this.#mapManager.getLevelHeight(),
            );
        }

        this.#mapManager.loadMap(dungeon, ctx, callback);
        this.#dialogueManager.loadDialogue(dungeon);

        this.#loadEntities(dungeon);
    }

    #loadEntities(dungeon) {
        const url = `../dungeon/${dungeon}/entity.json`;

        fetch(url, {
            method: "GET",
            headers: {
                'Accept': 'application/json',
            },
        })

        .then(response => response.json())

        .then(response => this.#parseEntities(response));
    }

    #parseEntities(entityArray) {
        this.#currentEntities = [];

        for (let i in entityArray) {
            const entity = entityArray[i];

            switch (entity.type) {
                case "npc":
                    const npc = new InteractableNPC(entity.x, entity.y);
                    npc.onInteract = () => {
                        this.#openConversation(entity.conv);
                    };
                    this.#currentEntities.push(npc);
                    break;

                case "bin":
                    const bin = new Bin(entity.x, entity.y, this.#party.getInventory());
                    this.#currentEntities.push(bin);
                    break;
            }
        }
    }

    #openConversation(conv) {
        this.#player.resetBools();
        this.#state = Overworld.State.Dialogue;

        const callback = () => {
            this.#state = Overworld.State.Playing;
        };

        this.#dialogueManager.openConversation(conv, callback);
    }
}

class MapManager {
    #currentMap;

    #mapWidth;
    #mapHeight;

    #mapTileWidth;
    #mapTileHeight;

    #tile;
    #numTiles = 18;

    constructor() {
        this.#loadTiles();
    }

    loadMap(dungeon, ctx, callback = null) {
        this.#currentMap = [];

        const filename = `dungeon/${dungeon}/structure.png`;

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

    #loadTiles() {
        this.#tile = [];
        for (let i = 0; i < this.#numTiles; i++) {
            const newImg = new Image();
            newImg.src = `art/tile/${i}.png`;
            this.#tile.push(newImg);
        }
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

class PauseMenu {
    static State = {
        Main: 0,
        ShowInventory: 1,
        ShowParty: 2,
        ShowMap: 3,
    };

    #state = PauseMenu.State.Main;
    #open = false;

    #optionsMenu;
    #playerInventory;

    constructor(playerInventory, ctx) {
        this.#playerInventory = playerInventory;

        this.#optionsMenu = new HoriztonalBox(20, 20, 450, 100, 3, ctx);

        this.#optionsMenu.addComponent(
            "Inventory", 
            ctx, 
            () => this.#setState(PauseMenu.State.ShowInventory));

        this.#optionsMenu.addComponent(
            "Party",
            ctx,
            () => this.#setState(PauseMenu.State.ShowParty)
        );
        this.#optionsMenu.setDisabledComponent(1, true);

        this.#optionsMenu.addComponent(
            "Map",
            ctx,
            () => this.#setState(PauseMenu.State.ShowParty)
        );
        this.#optionsMenu.setDisabledComponent(2, true);
    }

    draw(ctx) {
        if (!this.#open) { return }

        this.#optionsMenu.draw(ctx);

        switch (this.#state) {
            case PauseMenu.State.ShowInventory:
                this.#playerInventory.draw(ctx);
        }
    }

    keyUp(key) {
        if (key === Keybind.Cancel) {
            this.#setState(PauseMenu.State.Main);
            return;
        }

        switch (this.#state) {
            case PauseMenu.State.Main:
                this.#optionsMenu.keyUp(key);
                break;

            case PauseMenu.State.ShowInventory:
                this.#playerInventory.keyUp(key);
                break;
        }
    }

    toggle() {
        this.#open = !this.#open;

        if (this.#open) {
            this.#setState(PauseMenu.State.Main);
        }
    }

    #setState(state) {
        this.#state = state;

        switch (state) {
            case PauseMenu.State.Main:
                this.#optionsMenu.setFocussed(true);
                return;

            case PauseMenu.State.ShowInventory:
                this.#playerInventory.setFocussed(true);
                break;
        }

        this.#optionsMenu.setFocussed(false);
    }
}