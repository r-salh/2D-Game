class Overworld {
    static Tutorial = "tutorial";

    static State = {
        Playing: 0,
        Paused: 1,
        Dialogue: 2,
        BinOpen: 3,
    };

    #party;
    #player;

    #camera;
    #mapManager;

    #dialogueManager;
    #pauseMenu;
    #binUI;

    #currentEntities;

    #state = Overworld.State.Playing;

    constructor(party, ctx) {
        this.#party = party;
        this.#player = party.getPlayer();

        // Initialise objects
        this.#camera = new Camera();
        this.#camera.setFollowing(this.#player);

        this.#mapManager = new MapManager();

        const inventory = party.getInventory();
        const onClose = () => {
            this.#setState(Overworld.State.Playing);
        };

        this.#dialogueManager = new DialogueManager(inventory, ctx);
        this.#dialogueManager.onClose = onClose;

        this.#pauseMenu = new PauseMenu(inventory, ctx);
        this.#pauseMenu.onClose = onClose;

        this.#binUI = new BinUI(inventory, ctx);
        this.#binUI.onClose = onClose;

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

        switch (this.#state) {
            case Overworld.State.Dialogue:
                this.#dialogueManager.draw(ctx);
                break;

            case Overworld.State.Paused:
                this.#pauseMenu.draw(ctx);
                break;

            case Overworld.State.BinOpen:
                this.#binUI.draw(ctx);
                break;
        }
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

            case Overworld.State.BinOpen:
                this.#binUI.keyUp(key);
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
                        this.#setState(Overworld.State.Dialogue, entity.conv);
                    };
                    this.#currentEntities.push(npc);
                    break;

                case "bin":
                    const bin = new Bin(entity.x, entity.y, this.#party.getInventory());
                    bin.onInteract = () => {
                        this.#setState(Overworld.State.BinOpen);
                    }
                    this.#currentEntities.push(bin);
                    break;
            }
        }
    }

    #setState(state, kwargs = null) {
        this.#state = state;

        switch (state) {
            case Overworld.State.Dialogue:
                this.#player.resetBools();
                this.#dialogueManager.openConversation(kwargs);
                break;

            case Overworld.State.BinOpen:
                this.#player.resetBools();
                this.#binUI.toggle();
                break;
        }

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
        Hidden: 0,
        Main: 1,
        ShowInventory: 2,
        ShowParty: 3,
        ShowMap: 4,
    };

    #state = PauseMenu.State.Hidden;

    #optionsMenu;
    #playerInventory;

    onClose;

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
        if (this.#state === PauseMenu.State.Hidden) { return }

        this.#optionsMenu.draw(ctx);

        switch (this.#state) {
            case PauseMenu.State.ShowInventory:
                this.#playerInventory.draw(ctx);
        }
    }

    keyUp(key) {
        if (key === Keybind.Cancel) {
            AudioPlayer.Next();
            if (this.#state === PauseMenu.State.Main) {
                this.#optionsMenu.setFocussed(true);
            } else {
                this.#setState(PauseMenu.State.Main);
            }
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
        AudioPlayer.Next();

        if (this.#state === PauseMenu.State.Hidden) {
            this.#setState(PauseMenu.State.Main);
        } else {
            this.#setState(PauseMenu.State.Hidden);
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

            case PauseMenu.State.Hidden:
                AudioPlayer.Next();
                if (typeof this.onClose === "function") {
                    this.onClose();
                }
                break;
        }

        this.#optionsMenu.setFocussed(false);
    }
}

class BinUI {
    static State = {
        Hidden: 0,
        Open: 1,
        ItemSelected: 2,
    }

    #playerInventory;

    #textBox;
    #itemGrid;
    #confirmSelection;

    #selectText = "Select an item to throw away";
    #confirmText = "Throw away X?";

    #state = BinUI.State.Hidden;
    #selectedItem;

    onClose;

    constructor(playerInventory, ctx) {
        this.#playerInventory = playerInventory;

        const padding = 20;
        const width = 450;
        const height = 80;
        this.#textBox = new TextBox(this.#selectText, padding, padding, width, height, ctx);
        this.#textBox.focussable = false;

        const gridHeight = 300;
        const gridY = 10 + padding + height;
        this.#itemGrid = new Grid(5, 3, padding, gridY, 450, gridHeight);

        const cX = padding * 4;
        const cWidth = width - cX*2;
        this.#confirmSelection = new HoriztonalBox(cX, gridY, cWidth, 60, 2);
        this.#confirmSelection.addComponent("Confirm", ctx, () => { this.#deleteItem(ctx) });
        this.#confirmSelection.addComponent("Cancel", ctx, () => { this.#cancel(ctx) });
    }

    toggle() {
        if (this.#state === BinUI.State.Hidden) {
            this.#state = BinUI.State.Open;
            this.#updateGrid();
            this.#itemGrid.setFocussed(true);
        } else {
            this.#state = BinUI.State.Hidden;
        }
    }

    draw(ctx) {
        if (this.#state === BinUI.State.Hidden) { return }

        this.#textBox.draw(ctx);
        
        switch (this.#state) {
            case BinUI.State.Open:
                this.#itemGrid.draw(ctx);
                break;

            case BinUI.State.ItemSelected:
                this.#confirmSelection.draw(ctx);
                break;
        }
    }

    keyUp(key) {
        switch (this.#state) {
            case BinUI.State.Open:
                if (key !== Keybind.Cancel) {
                    this.#itemGrid.keyUp(key);
                    return;
                } 

                this.#state = BinUI.State.Hidden;
                AudioPlayer.Next();
                if (typeof this.onClose === "function") {
                    this.onClose();
                }
                break;

            case BinUI.State.ItemSelected:
                if (key === Keybind.Cancel) {
                    const ctx = document.getElementById("game-canvas").getContext("2d");
                    this.#cancel(ctx);
                } else {
                    this.#confirmSelection.keyUp(key);
                }
                break;
        }
    }

    #updateGrid() {
        const ctx = document.getElementById("game-canvas").getContext("2d");

        this.#itemGrid.clear();

        const items = this.#playerInventory.getItems();

        for (let x in items) {
            const item = items[x];
            const onClick = () => {
                this.#select(item, ctx);
            }
            this.#itemGrid.addComponent(item, ctx, onClick);

            const itemType = Inventory.ItemList[item].type;
            if (itemType === "item") {
                this.#itemGrid.setDisabledComponent(x, true);
            }
        }

        if (items.length === Inventory.Capacity) { return }

        for (let i = items.length; i < 15; i++) {
            this.#itemGrid.addComponent("------", ctx);
            this.#itemGrid.setDisabledComponent(i, true);
        }
    }

    #select(item, ctx) {
        this.#state = BinUI.State.ItemSelected;
        this.#selectedItem = item;

        const text = this.#confirmText.replace("X", item);
        this.#textBox.setText(text, ctx);
        this.#confirmSelection.setFocussed(true);
    }

    #deleteItem(ctx) {
        this.#playerInventory.removeItem(this.#selectedItem);
        this.#state = BinUI.State.Open;

        this.#textBox.setText(this.#selectText, ctx);
        this.#updateGrid();
        this.#itemGrid.setFocussed(true);
    }

    #cancel(ctx) {
        AudioPlayer.Next();
        this.#state = BinUI.State.Open;
        this.#textBox.setText(this.#selectText, ctx);
    }   
}