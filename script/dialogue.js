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

    #nameLabel;
    #dialogueArea

    constructor(ctx) {
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
        if (this.#state === DialogueManager.State.Hidden) {
            return;
        }

        this.#timeElapsed += deltaT;
        if (this.#timeElapsed < this.animationSpeed) {
            return;
        }

        this.#timeElapsed -= this.animationSpeed;
        this.#charIndex++;

        const line = this.#currentLine();

        switch (this.#state) {
            case DialogueManager.State.Finished:
                break;
            
            case DialogueManager.State.Writing:
                break;
        }

        if (this.#charIndex > line.length) {
            this.#state = DialogueManager.State.Finished;
            this.#dialogueArea.setText(line, ctx);

        } else {
            const text = line.slice(0, this.#charIndex);
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

    openConversation(conv) {
        this.#currentConv = conv;
        this.#lineIndex = -1;
        this.#dialogueArea.clear();

        this.#nextLine();
    }

    closeConversation() {
        this.#state = DialogueManager.State.Hidden;
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

    isOpen() {
        return this.#state !== DialogueManager.State.Hidden;
    }

    #skipAnimation() {
        AudioPlayer.Next();
        this.#charIndex = this.#currentLine().length;
        this.#state = DialogueManager.State.Finished;
    }

    #nextLine() {
        AudioPlayer.Next();
        this.#lineIndex++;

        if (this.#lineIndex >= this.#dialogue[this.#currentConv].length) {
            this.closeConversation();
            return;
        }

        const ctx = document.getElementById("game-canvas").getContext("2d");

        this.#nameLabel.setText(this.#currentCharacter(), ctx);
        this.#state = DialogueManager.State.Writing;
        this.#charIndex = 1;
    }

    #currentLine() {
        return this.#dialogue[this.#currentConv][this.#lineIndex].line;
    }

    #currentCharacter() {
        return this.#dialogue[this.#currentConv][this.#lineIndex].name;
    }
}