//---------------------------------------------------------------
// Game class

class Game {
    static State = {
        LOADING: 0,
        OVERWORLD: 1,
        MENU: 2,
    };

    static AspectRatio = 0.75;
    static CanvasWidth = 700;
    static CanvasHeight = Game.CanvasWidth * Game.AspectRatio;
    static TileSize = 80;
    static TilesInWidth = Game.CanvasWidth / Game.TileSize;
    static TilesInHeight = Game.CanvasHeight / Game.TileSize;

    #ctx;
    #canvas;

    #lastTime = 0;

    #imgLoader;
    #menu;
    #overworld;

    currentState = Game.State.MENU;

    constructor() {
        this.#initCanvas();

        const onLoaded = () => {
            this.currentState = Game.State.MENU;
        };
        this.#imgLoader = new ImageLoader(this.#ctx, () => setTimeout(onLoaded, 1500) );

        this.#menu = new Menu(this.#ctx);
        this.#overworld = new Overworld(this.#ctx);

        this.#addEventListeners();
        requestAnimationFrame(t => this.loop(t));
    }

    loop(timestamp) {
        // Calculate delta time in SECONDS
        const deltaT = (timestamp - this.#lastTime) / 1000;

        // Update lastTime for the next frame
        this.#lastTime = timestamp;

        this.update(deltaT);
        this.render();

        requestAnimationFrame(t => this.loop(t));
    }

    render() {
        this.#ctx.fillStyle = '#1d1d1d'; 
        this.#ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);

        switch (this.currentState) {
            case Game.State.LOADING:
                this.#imgLoader.draw(this.#ctx);
                break;

            case Game.State.MENU:
                this.#menu.draw(this.#ctx);
                break;

            case Game.State.OVERWORLD:
                this.#overworld.draw(this.#ctx);
                break;
        }
    }

    update(deltaT) {
        switch (this.currentState) {
            case Game.State.LOADING:
                this.#imgLoader.update(deltaT);
                break;

            case Game.State.MENU:
                break;

            case Game.State.OVERWORLD:
                this.#overworld.update(deltaT);
                break;
        }
    }

    keyUp(e) {
        const key = e.key.toLowerCase();

        switch (this.currentState) {
            case Game.State.MENU:
                this.#menu.keyUp(key);
                break;

            case Game.State.OVERWORLD:
                this.#overworld.keyUp(key);
                break;
        }
    }

    keyDown(e) {
        const key = e.key.toLowerCase();

        switch (this.currentState) {
            case Game.State.MENU:
                break;

            case Game.State.OVERWORLD:
                this.#overworld.keyDown(key);
                break;
        }
    }

    #initCanvas() {
        let container = document.getElementById("container");

        this.#canvas = document.createElement("canvas");
        this.#canvas.id = "game-canvas";
        this.#canvas.width = Game.CanvasWidth;
        this.#canvas.height = Game.CanvasHeight;
        container.appendChild(this.#canvas);

        this.#ctx = this.#canvas.getContext('2d');
        this.#ctx.imageSmoothingEnabled = false;
    }

    #addEventListeners() {
        window.addEventListener("keyup", e => this.keyUp(e));
        window.addEventListener("keydown", e => this.keyDown(e));
    }
}

//---------------------------------------------------------------
// Main program

const game = new Game();
