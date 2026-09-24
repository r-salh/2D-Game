class Interactable {
    promptRadius = 90;
    showPrompt = false;
    onInteract = null;

    #sprite;
    #x;
    #y;
    #width;
    #height;

    #promptX;
    #promptY;

    #centerX;
    #centerY;

    constructor(sprite, tileX, tileY, width, height) {
        this.#sprite = sprite;

        const xOffset = (Game.TileSize - width) / 2;
        const yOffset = Game.TileSize - height;

        this.#x = tileX * Game.TileSize + xOffset;
        this.#y = tileY * Game.TileSize + yOffset;
        this.#width = width;
        this.#height = height;

        this.#centerX = this.#x + this.#width/2;
        this.#centerY = this.#y + this.#height/2;

        this.#promptX = this.#centerX - 5;
        this.#promptY = this.#y - 5;
    }

    draw(ctx, camera) {
        const cameraX = camera.getX();
        const cameraY = camera.getY();

        ctx.fillStyle = "pink";
        ctx.drawImage(this.#sprite, this.#x - cameraX, this.#y - cameraY, this.#width, this.#height);

        if (this.showPrompt === true) {
            ctx.fillStyle = "black";
            ctx.fillText("!", this.#promptX - cameraX, this.#promptY - cameraY);
        }
    }

    update(playerX, playerY) {
        const deltaX = Math.abs(playerX - this.#centerX);
        const deltaY = Math.abs(playerY - this.#centerY);
        const dist = Math.sqrt(deltaX*deltaX + deltaY*deltaY);

        if (dist < this.promptRadius) {
            this.showPrompt = true;
        } else {
            this.showPrompt = false;
        }
    }

    interact() {
        if (this.showPrompt === false) {
            return;
        }

        if (typeof this.onInteract === "function") {
            AudioPlayer.Next();
            this.onInteract();
        }
    }
}

class InteractableNPC extends Interactable {
    constructor(tileX, tileY) {
        super(ImageLoader.PlayerImages.standDown[0], tileX, tileY, Player.Size, Player.Size);
    }
}

class Bin extends Interactable {
    #playerInventory;
    constructor(tileX, tileY, playerInventory) {
        super(ImageLoader.Bin, tileX, tileY, Player.Size, Player.Size);

        this.#playerInventory = playerInventory;
    }
}

class Party {
    #player;
    #inventory;

    constructor(ctx) {
        this.#player = new Player();
        this.#inventory = new Inventory(ctx);
    }

    update(deltaT) {
        this.#player.update(deltaT);
    }

    draw(ctx, camera) {
        this.#player.draw(ctx, camera);
    }

    getPlayer() {
        return this.#player;
    }

    getInventory() {
        return this.#inventory;
    }
}

class Player {
    static Size = 80;
    static Speed = 300;
    static SprintSpeed = Math.floor(Player.Speed * 1.5);

    static AnimationSpeed = 18;
    static AnimationSpeedSprinting = 11;

    #x = 100;
    #y = 100;
    #moving = false;
    #currentSpeed = Player.Speed;
    #sprinting = false;

    #direction = {
        up: 0,
        down: 0,
        left: 0,
        right: 0,
    }

    #action = "walkDown";
    #aniIndex = 0;
    #aniFrame = 0;
    #aniSpeed = Player.AnimationSpeed; // Game frames per animation frame

    #sprite = ImageLoader.PlayerImages;

    update(deltaT) {
        this.#updatePosition(deltaT);
        this.#updateAnimationTick();
    }

    draw(ctx, camera) {
        const x = Math.floor(this.#x - camera.getX());
        const y = Math.floor(this.#y - camera.getY());

        ctx.drawImage(this.#sprite[this.#action][this.#aniIndex], x, y, Player.Size, Player.Size);
    }

    keyDown(key) {
        switch (key) {
            case Keybind.Up:
                this.#direction.up = 1;
                break;
            
            case Keybind.Left:
                this.#direction.left = 1;
                break;

            case Keybind.Right:
                this.#direction.right = 1;
                break;

            case Keybind.Down:
                this.#direction.down = 1;
                break;
            
            case Keybind.Cancel:
                this.#sprinting = true;
                break;
        }
    }

    keyUp(key) {
        switch (key) {
            case Keybind.Up:
                this.#direction.up = 0;
                break;
            
            case Keybind.Left:
                this.#direction.left = 0;
                break;

            case Keybind.Right:
                this.#direction.right = 0;
                break;

            case Keybind.Down:
                this.#direction.down = 0;
                break;

            case Keybind.Cancel:
                this.#sprinting = false;
                break;
        }
    }

    resetBools() {
        for (let key in this.#direction) {
            this.#direction[key] = 0;
        }
        this.#sprinting = false;
    }

    getX() {
        return this.#x + Player.Size/2;
    }

    getY() {
        return this.#y + Player.Size/2;
    }

    #updatePosition(deltaT) {
        if (this.#sprinting === true) {
            this.#currentSpeed = Player.SprintSpeed;
            this.#aniSpeed = Player.AnimationSpeedSprinting;
        } else {
            this.#currentSpeed = Player.Speed;
            this.#aniSpeed = Player.AnimationSpeed;
        }

        const hor = this.#direction.right - this.#direction.left;
        const ver = this.#direction.down - this.#direction.up;

        let deltaX = hor * this.#currentSpeed * deltaT;
        let deltaY = ver * this.#currentSpeed * deltaT;

        if (hor != 0 && ver != 0) {
            deltaX = deltaX * 0.707;
            deltaY = deltaY * 0.707;
        }

        if (hor != 0 || ver != 0) {
            this.#moving = true;
        } else {
            this.#moving = false;
        }

        this.#x += deltaX;
        this.#y += deltaY;

        this.#updateAnimation(hor, ver);
    }

    #updateAnimation(hor, ver) {
        const lastAction = this.#action;

        if (ver == 1) {
            this.#action = "walkDown";

        } else if (ver == -1) {
            this.#action = "walkUp";

        } else if (hor == -1) {
            this.#action = "walkLeft";

        } else if (hor == 1) {
            this.#action = "walkRight";
        }

        if (lastAction !== this.#action) {
            this.#aniIndex = 0;
            this.#aniFrame = 0;
        }

        if (this.#moving === true) { return; }

        this.#aniIndex = 0;
        this.#aniFrame = 0;

        switch (lastAction) {
            case "walkDown":
                this.#action = "standDown";
                break;
            
            case "walkUp":
                this.#action = "standUp";
                break;

            case "walkLeft":
                this.#action = "standLeft";
                break;
            
            case "walkRight":
                this.#action = "standRight";
                break;
        }
    }

    #updateAnimationTick() {
        if (this.#moving !== true) {
            return;
        }

        this.#aniFrame++;
        if (this.#aniFrame >= this.#aniSpeed) {
            this.#aniIndex += 1;
            this.#aniIndex = this.#aniIndex % this.#sprite[this.#action].length;
            this.#aniFrame = 0;
        }
    }
}

class Inventory {
    static Capacity = 15;
    static ItemList = {};

    #items;

    #grid;
    
    #itemComponents = [];
    #infoBackground;
    #itemName;
    #itemDesc;
    #itemStrength;
    #itemType;

    constructor(ctx) {
        this.#items = [
            "Apple",
            "Mini Dew",
            "Monster",
            "Veggie B.",
        ];

        this.#initUIComponents(ctx);

        if (this.#gameItemsNotLoaded()) {
            this.#loadGameItems();
        }
    }

    addItem(item) {
        if (this.#items.length >= Inventory.Capacity) {
            return 1;
        }

        this.#items.push(item);
        this.#items.sort();
        this.#updateGrid();
    }

    removeItem(item) {
        const index = this.#items.indexOf(item);
        this.#items.splice(index, 1);
        this.#updateGrid();
    }

    draw(ctx) {
        this.#grid.draw(ctx);
        
        for (let i in this.#itemComponents) {
            this.#itemComponents[i].draw(ctx);
        }
    }

    getItems() {
        return this.#items;
    }

    keyUp(key) {
        this.#grid.keyUp(key);
    }

    setFocussed(focussed) {
        this.#grid.setFocussed(focussed);
        
        for (let i in this.#itemComponents) {
            this.#itemComponents[i].visible = false;
        }
    }

    #updateGrid() {
        const ctx = document.getElementById("game-canvas").getContext("2d");

        this.#grid.clear();
        for (let i in this.#items) {
            const itemName = this.#items[i];
            const onClick = () => {
                this.#showItemInfo(itemName);
            }
            this.#grid.addComponent(itemName, ctx, onClick);
        }

        if (this.#items.length == Inventory.Capacity) { return }

        for (let i = this.#items.length; i < 15; i++) {
            this.#grid.addComponent("------", ctx);
            this.#grid.setDisabledComponent(i, true);
        }
    }

    #showItemInfo(itemName) {
        const ctx = document.getElementById("game-canvas").getContext("2d");

        const itemProperties = Inventory.ItemList[itemName];
        const itemDesc = itemProperties.desc;
        const itemType = itemProperties.type.charAt(0).toUpperCase() + itemProperties.type.substring(1);

        this.#itemName.setText(itemName, ctx);
        this.#itemDesc.setText(itemDesc, ctx);
        this.#itemType.setText(itemType, ctx);

        switch (itemType) {
            case "Food":
                const hp = itemProperties.hp;
                this.#itemStrength.setText(`Recovers ${hp} HP`, ctx);
                break;

            case "Drink":
                const mp = itemProperties.mp;
                this.#itemStrength.setText(`Recovers ${mp} MP`, ctx);
                break;

            default:
                this.#itemStrength.setText("", ctx);
        }

        for (let i in this.#itemComponents) {
            this.#itemComponents[i].visible = true;
        }
    }

    #loadGameItems() {
        const assetFile = [
            "drink",
            "food",
            "item"
        ];

        for (let i in assetFile) {
            this.#loadJSON(assetFile[i]);
        }
    }

    #loadJSON(filename) {
        const url = `assets/${filename}.json`;

        fetch(url, {
            method: "GET",
            headers: {
                'Accept': 'application/json',
            },
        })
        .then(response => response.json())
        .then(response => {
            this.#parseItems(filename, response);
        })
    }

    #parseItems(itemType, itemArray) {
        for (let itemName in itemArray) {
            const itemObj = itemArray[itemName];
            itemObj.type = itemType;
            Inventory.ItemList[itemName] = itemObj;
        }
    }

    #gameItemsNotLoaded() {
        return Object.keys(Inventory.ItemList).length === 0;
    }

    #initUIComponents(ctx) {
        const gridHeight = 300;
        const gridY = 130;

        this.#grid = new Grid(5, 3, 20, gridY, 450, gridHeight);
        this.#updateGrid();

        const smHeight = 45;
        const medHeight = 100;

        const infoWidth = 200;
        const infoHeight = 3*smHeight + medHeight - 4;
        const infoX = 480;
        const infoY = gridY;

        this.#infoBackground = new TextBox("", infoX, infoY, infoWidth, infoHeight, ctx);
        this.#infoBackground.visible = false;
        this.#itemComponents.push(this.#infoBackground);
        
        this.#itemName = new TextBox("item name", infoX, infoY, infoWidth, smHeight, ctx);
        this.#itemComponents.push(this.#itemName);
        
        const descY = infoY + smHeight;
        this.#itemDesc = new TextBox("Item description item description", infoX, descY, infoWidth, medHeight, ctx);
        this.#itemComponents.push(this.#itemDesc);

        const strengthY = descY + medHeight;
        this.#itemStrength = new TextBox("Heals 5 hp", infoX, strengthY, infoWidth, smHeight, ctx);
        this.#itemComponents.push(this.#itemStrength);

        const typeY = strengthY + smHeight - 10;
        this.#itemType = new TextBox("Item type", infoX, typeY, infoWidth, smHeight, ctx);
        this.#itemComponents.push(this.#itemType);


        for (let i = 1; i < this.#itemComponents.length; i++) {
            const component = this.#itemComponents[i];
            component.setAlignment(TextBox.Alignment.TopLeft, ctx);
            component.focussable = false;
        }
        for (let i = 2; i < this.#itemComponents.length; i++) {
            const component = this.#itemComponents[i];
            component.background = null;
            component.border = null;
        }
    }
}