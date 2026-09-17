class DialogueManager {
    static State = {
        Writing: 0,
        Finished: 1,
        Hidden: 2,
    }

    static World1 = "world_1";

    animationSpeed = 1/15;
    #state = DialogueManager.State.Hidden;
    #timeElapsed = 0;

    #dialogue;
    #currentConv;
    #lineIndex = -1;
    #charIndex = 1;
    #currentLine;

    #nameLabel;
    #dialogueArea

    #playerInventory;

    #callback;

    constructor(inventory, ctx) {
        this.#playerInventory = inventory;

        const padding = 20;
        const daWidth = Game.CanvasWidth - padding*2;
        const daHeight = 110;
        const daY = Game.CanvasHeight - (daHeight + padding);
        this.#dialogueArea = new TextBox("", padding, daY, daWidth, daHeight, ctx);
        this.#dialogueArea.focussable = false;

        const nlHeight = 40;
        const nlY = daY - nlHeight - 1;
        const nlWidth = 150;
        this.#nameLabel = new TextBox("You", padding, nlY, nlWidth, nlHeight, ctx);
        this.#nameLabel.focussable = false;
    }

    draw(ctx) {
        if (this.#state === DialogueManager.State.Hidden) {
            return;
        }

        this.#dialogueArea.draw(ctx);
        this.#nameLabel.draw(ctx);
    }

    update(deltaT, ctx) {
        if (this.#state !== DialogueManager.State.Writing) {
            return;
        }

        this.#timeElapsed += deltaT;
        if (this.#timeElapsed < this.animationSpeed) {
            return;
        }

        this.#timeElapsed -= this.animationSpeed;
        this.#charIndex++;

        if (this.#charIndex > this.#currentLine.length) {
            this.#state = DialogueManager.State.Finished;
            this.#dialogueArea.setText(this.#currentLine, ctx);

        } else {
            const text = this.#currentLine.slice(0, this.#charIndex);
            this.#dialogueArea.setText(text, ctx);
        }
    }

    loadDialogue(dungeon) {
        const url = `../dungeon/${dungeon}/dialogue.json`;

        fetch(url, {
            method: "GET",
            headers: {
                'Accept': 'application/json',
            },
        })
        .then(response => response.json())
        .then(response => {
            this.#dialogue = response;
        })
    }

    openConversation(conv, callback = null) {
        this.#currentConv = conv;
        this.#lineIndex = -1;
        this.#dialogueArea.clear();

        this.#callback = callback;

        this.#nextLine();
    }

    closeConversation() {
        this.#state = DialogueManager.State.Hidden;

        if (typeof this.#callback === "function") {
            this.#callback();
        }
    }

    next() {
        switch (this.#state) {
            case DialogueManager.State.Writing:
                this.#skipAnimation();
                break;

            case DialogueManager.State.Finished:
                this.#nextLine();
                break;
        }
    }

    #skipAnimation() {
        AudioPlayer.Next();
        this.#charIndex = this.#currentLine.length;
    }

    #nextLine() {
        AudioPlayer.Next();
        this.#lineIndex++;

        if (this.#lineIndex >= this.#getConversationLength()) {
            this.closeConversation();
            return;
        }

        switch (this.#getLineType()) {
            case "dialogue":
                const ctx = document.getElementById("game-canvas").getContext("2d");
                this.#nameLabel.setText(this.#getCharacter(), ctx);
                this.#nameLabel.visible = true;

                this.#currentLine = this.#getLine();
                this.#charIndex = 1;
                break;

            case "item":
                const item = this.#getItemName();

                this.#nameLabel.visible = false;
                this.#charIndex = this.#currentLine.length;

                const inventoryFull = this.#playerInventory.addItem(item);
                if (inventoryFull === 1) {
                    this.#currentLine = `* Inventory Full *`;
                } else {
                    this.#currentLine = `* Obtained ${item} *`;
                }
                break;
        }

        this.#state = DialogueManager.State.Writing;
    }

    #getLineType() {
        return this.#dialogue[this.#currentConv][this.#lineIndex].type;
    }

    #getLine() {
        return this.#dialogue[this.#currentConv][this.#lineIndex].line;
    }

    #getCharacter() {
        return this.#dialogue[this.#currentConv][this.#lineIndex].name;
    }

    #getItemName() {
        return this.#dialogue[this.#currentConv][this.#lineIndex].item;
    }

    #getConversationLength() {
        return this.#dialogue[this.#currentConv].length;
    }
}