class Menu {
    constructor(ctx) {
        this.hBox = new HoriztonalBox(20, 20, 500, 100, 3, ctx);

        this.hBox.addComponent("Open Grid", ctx, () => {
            this.hBox.setFocussed(false);
            this.grid.setFocussed(true);
            this.grid.visible = true;
        });

        this.hBox.addComponent("Disabled", ctx);
        this.hBox.setDisabledComponent(1, true);

        this.hBox.addComponent("Play", ctx, () => {
            game.currentState = Game.State.OVERWORLD;
        });
        this.hBox.setFocussed(true);

        this.grid = new Grid(3, 2, 90, 105, 220, 200);
        this.grid.visible = false;

        this.grid.addComponent("item 1", ctx);
        this.grid.addComponent("item 2", ctx);
        this.grid.addComponent("item 3", ctx);
        this.grid.addComponent("item 4", ctx);
        this.grid.addComponent("item 5", ctx);

        this.grid.setDisabledComponent(3, true);

        this.grid.addComponent("Close", ctx, () => {
            this.grid.visible = false;
            this.hBox.setFocussed(true);
        });
    }

    draw(ctx) {
        this.hBox.draw(ctx);
        this.grid.draw(ctx);
    }

    setFocussed(focussed) {
        if (focussed !== true) {
            return;
        }

        this.hBox.setFocussed(true);
        this.hBox.setFocussedComponent(2);
    }

    keyUp(key) {
        if (this.grid.visible === true) {
            this.grid.keyUp(key);
        } else  {
            this.hBox.keyUp(key);
        }
    }
}