class Menu {
    constructor(ctx) {
        this.hBox = new HoriztonalBox(20, 20, 500, 100, 3, ctx);

        this.hBox.addComponent("Open vBox", ctx, () => {
            this.hBox.setFocussed(false);
            this.vBox.setFocussed(true);
            this.vBox.visible = true;
        });

        this.hBox.addComponent("Disabled", ctx);
        this.hBox.setDisabledComponent(1, true);

        this.hBox.addComponent("Play", ctx, () => {
            game.currentState = Game.State.OVERWORLD;
        });
        this.hBox.setFocussed(true);

        this.vBox = new VerticalBox(50, 50, 140, 250, 4, ctx);
        this.vBox.visible = false;

        this.vBox.addComponent("item 1", ctx);
        this.vBox.addComponent("item 2", ctx);
        this.vBox.addComponent("item 3", ctx);
        this.vBox.addComponent("Close", ctx, () => {
            this.vBox.visible = false;
            this.hBox.setFocussed(true);
        });
    }

    draw(ctx) {
        this.hBox.draw(ctx);
        this.vBox.draw(ctx);
    }

    setFocussed(focussed) {
        if (focussed !== true) {
            return;
        }

        this.hBox.setFocussed(true);
        this.hBox.setFocussedItem(2);
    }

    keyUp(key) {
        if (this.vBox.visible === true) {
            this.vBox.keyUp(key);
        } else  {
            this.hBox.keyUp(key);
        }
    }
}