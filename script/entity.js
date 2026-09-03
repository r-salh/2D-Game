const Keybind = {
    Up: "ArrowUp",
    Left: "ArrowLeft",
    Down: "ArrowDown",
    Right: "ArrowRight",
    Accept: "c",
    Cancel: "x",
    Menu: "z",
}

class Party {
    //TODO
}

class Player {
    static Size = 60;
    static Speed = 250;
    static SprintSpeed = Math.floor(Player.Speed * 1.2);

    #x = 100;
    #y = 100;
    #currentSpeed = Player.Speed;

    #direction = {
        up: 0,
        down: 0,
        left: 0,
        right: 0,
    }
    #sprinting = false;

    update(deltaT) {
        const hor = this.#direction.right - this.#direction.left;
        const ver = this.#direction.down - this.#direction.up;

        let deltaX = hor * this.#currentSpeed * deltaT;
        let deltaY = ver * this.#currentSpeed * deltaT;

        if (hor != 0 && ver != 0) {
            deltaX = deltaX * 0.707;
            deltaY = deltaY * 0.707;
        }

        this.#x += deltaX;
        this.#y += deltaY;
    }

    draw(ctx, camera) {
        const x = Math.floor(this.#x - camera.getX());
        const y = Math.floor(this.#y - camera.getY());

        ctx.fillStyle = "lightblue";
        ctx.fillRect(x, y, Player.Size, Player.Size);
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
        }
    }

    getX() {
        return this.#x + Player.Size/2;
    }

    getY() {
        return this.#y + Player.Size/2;
    }
}