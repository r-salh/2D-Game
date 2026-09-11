class Interactable {
    promptRadius = 160;
    showPrompt = false;
    onInteract = null;

    #sprite;
    #x;
    #y;
    #width;
    #height;

    #promptX;
    #promptY;

    constructor(sprite, tileX, tileY, width, height) {
        this.#sprite = sprite;

        const xOffset = (Game.TileSize - width) / 2;
        const yOffset = Game.TileSize - height;

        this.#x = tileX * Game.TileSize + xOffset;
        this.#y = tileY * Game.TileSize + yOffset;
        this.#width = width;
        this.#height = height;

        this.#promptX = this.#x + this.#width/2 - 5;
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
        const deltaX = Math.abs(playerX - this.#x);
        const deltaY = Math.abs(playerY - this.#y);
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

class Party {
    #player;

    constructor() {
        this.#player = new Player();
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