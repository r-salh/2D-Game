class ImageLoader {
    #loaded = 0;
    #totalImgs = 12;
    #finished = false;
    #onLoaded;

    static PlayerRoot = "art/sprite/body1/";
    static PlayerImageUrls = {
        standDown: [
            "stand/down.png"
        ],
        standUp: [
            "stand/up.png"
        ],
        standRight: [
            "walk/right/1.png"
        ],
        standLeft: [
            "walk/left/1.png"
        ],
        walkUp: [
            "walk/up/0.png",
            "walk/up/1.png"
        ],
        walkDown: [
            "walk/down/0.png",
            "walk/down/1.png"
        ],
        walkLeft: [
            "walk/left/0.png",
            "walk/left/1.png"
        ],
        walkRight: [
            "walk/right/0.png",
            "walk/right/1.png"
        ],
    };
    static PlayerImages = {}

    #loadingText = "Loading...";
    #finishedText = "Finished loading!";

    #loadingTextX;
    #finishedTextX;
    #txtY;

    constructor(ctx, onLoaded = null) {
        this.#onLoaded = onLoaded;

        this.#centerText(ctx);

        this.#loadImages();
    }

    update(deltaT) {
        if (this.#finished === true) {
            return;
        }

        if (this.#loaded >= this.#totalImgs) {
            this.#finished = true;

            if (typeof this.#onLoaded === "function") { this.#onLoaded(); }
            return;
        }
    }

    draw(ctx) {
        ctx.fillStyle = Theme.FocussedColor;
        ctx.font = Theme.Font;

        if (this.#finished === true) {
            ctx.fillText(this.#finishedText, this.#finishedTextX, this.#txtY);
        } else {
            ctx.fillText(this.#loadingText, this.#loadingTextX, this.#txtY);
        }
    }

    #loadImages() {
        for (let key in ImageLoader.PlayerImageUrls) {
            let imgSet = ImageLoader.PlayerImageUrls[key];
            ImageLoader.PlayerImages[key] = [];

            for (let i in imgSet) {
                let img = new Image();
                img.onload = () => {
                    this.#loaded++;
                };
                img.src = ImageLoader.PlayerRoot + imgSet[i];
                ImageLoader.PlayerImages[key].push(img);
            }
        }
    }

    #centerText(ctx) {
        ctx.font = Theme.Font;

        const metrics = ctx.measureText(this.#loadingText);
        const txtWidth = metrics.width;
        const txtHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

        this.#loadingTextX = (Game.CanvasWidth - txtWidth) / 2;
        this.#txtY = (Game.CanvasHeight - txtHeight) / 2;

        const finishedTextWidth = ctx.measureText(this.#finishedTextX).width;
        this.#finishedTextX = Game.CanvasWidth/2 - finishedTextWidth;
    }
}