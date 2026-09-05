//---------------------------------------------------------------
// Global Constants

const Theme = {
    FocussedColor: "white",
    DefaultColor: "#d8d7d7",
    DisabledColor: "#858585",

    Background: "black",
    Border: "white",
    LineWidth: 1.5,

    Font: "20px Arial",
}

const Keybind = {
    Up: "ArrowUp",
    Left: "ArrowLeft",
    Down: "ArrowDown",
    Right: "ArrowRight",
    Accept: "c",
    Cancel: "x",
    Menu: "z",
}

//---------------------------------------------------------------
// Classes

class TextBox {
    static Cursor = "☞ ";

    #text;

    #x;
    #y;
    #width;
    #height;

    #textX;
    #textY;

    #cursorX;

    onClick = null;
    focussable = true;
    focussed = false;
    disabled = false;
    visible = true;

    background = Theme.Background;
    border = Theme.Border;
    font = Theme.Font;
    borderWidth = Theme.LineWidth;

    constructor(
        text,
        x,
        y,
        width,
        height,
        ctx
    ) {
        this.#text = text;
        this.#x = x;
        this.#y = y;
        this.#width = width;
        this.#height = height;

        this.#setPadding(ctx);
    }

    setText(text, ctx) {
        this.#text = text;
        this.#setPadding(ctx);
    }

    handleAction() {
        if (typeof this.onClick === "function") {
            AudioPlayer.Click();
            this.onClick();
        } else {
            AudioPlayer.Negative();
        }
    }

    draw(ctx) {
        if (this.visible != true) {
            return;
        }

        if (typeof this.background === "string") {
            ctx.fillStyle = this.background;
            ctx.fillRect(this.#x, this.#y, this.#width, this.#height);
        }

        if (typeof this.border === "string") {
            ctx.lineWidth = this.borderWidth;
            ctx.strokeStyle = this.border;
            ctx.strokeRect(this.#x, this.#y, this.#width, this.#height);
        }

        this.#setFontColor(ctx);
        ctx.font = this.font;
        ctx.fillText(this.#text, this.#textX, this.#textY);

        if (this.focussed && this.focussable) {
            ctx.fillText(TextBox.Cursor, this.#cursorX, this.#textY);
        }
    }

    #setPadding(ctx) {
        ctx.font = this.font;
        const metrics = ctx.measureText(this.#text);
        const txtWidth = metrics.width;
        const txtHeight = metrics.actualBoundingBoxAscent;

        const xPadding = (this.#width - txtWidth)/2;
        const yPadding = (this.#height + txtHeight)/2;

        this.#textX = this.#x + xPadding;
        this.#textY = this.#y + yPadding;

        // Cursor placement
        if (this.focussable) {
            const cursorMetrics = ctx.measureText(TextBox.Cursor);
            this.#cursorX = this.#textX - cursorMetrics.width;
        }
    }

    #setFontColor(ctx) {
        if (this.disabled === true) {
            ctx.fillStyle = Theme.DisabledColor;

        } else if (this.focussed === true || this.focussable === false) {
            ctx.fillStyle = Theme.FocussedColor;
            
        } else {
            ctx.fillStyle = Theme.DefaultColor;
        }
    }
}

class BoxContainer {
    // Abstract superclass for vBox and hBox

    _focussed = false;
    _focussedIndex = 0;

    _components = [];
    
    visible = true;

    background = Theme.Background;
    border = Theme.Border;
    font = Theme.Font;
    borderWidth = Theme.LineWidth;

    constructor(x, y, width, height, maxComponents) {
        if (this.constructor === BoxContainer) {
            throw new Error("Abstract class BoxContainer cannot be instantiated.");
        }
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;

        this._maxComponents = maxComponents;

    }

    draw(ctx) {
        if (!this.visible) {
            return;
        }

        if (typeof this.background === "string") {
            ctx.fillStyle = this.background;
            ctx.fillRect(this._x, this._y, this._width, this._height);
        }

        if (typeof this.border === "string") {
            ctx.lineWidth = this.borderWidth;
            ctx.strokeStyle = this.border;
            ctx.strokeRect(this._x, this._y, this._width, this._height);
        }

        for (let i in this._components) {
            this._components[i].draw(ctx);
        }
    }

    setFocussed(focussed) {
        this._focussed = focussed;

        if (this._components.length === 0) {
            return;
        }

        this.#focussedComponent().focussed = false;

        if (!focussed) {
            return;
        }

        // Set first item that is not disabled to focussed
        this._focussedIndex = 0;
        while (this._focussedIndex < this._components.length) {
            if (this.#focussedComponent().disabled == false) {
                break;
            }
            this._focussedIndex++;
        }
        this.#focussedComponent().focussed = true;
    }

    setFocussedItem(i) {
        if (!this._focussed || i) {
            return;
        }

        this.#focussedComponent().focussed = false;
        this._focussedIndex = i;
        this.#focussedComponent().focussed = true;
    }

    addComponent(txt, x, y, width, height, ctx, onClick = null) {
        if (this._components.length === this._maxComponents) {
            throw new Error("Max container items reached");
        }

        const newComponent = new TextBox(txt, x, y, width, height, ctx);
        newComponent.border = null;
        newComponent.background = null;

        if (typeof onClick === "function") {
            newComponent.onClick = onClick;
        }

        this._components.push(newComponent);
    }

    setComponent(i, txt, x, y, width, height, ctx, onClick = null) {
        const newComponent = new TextBox(txt, x, y, width, height, ctx);
        newComponent.border = null;
        newComponent.background = null;

        if (typeof onClick === "function") {
            newComponent.onClick = onClick;
        }

        this._components[i] = newComponent;
    }

    setDisabledComponent(i, disabled) {
        this._components[i].disabled = disabled;
    }

    handleAction() {
        this.#focussedComponent().handleAction();
    }

    focusNeighbourNext() {
        if (this._components.length == 0) {
            return;
        }

        let i = 1;
        const numNeighboursRight = this._components.length - this._focussedIndex - 1;
        while (i <= numNeighboursRight) {
            const nextNeighbour = this._components[this._focussedIndex + i];
            if (nextNeighbour.disabled === false) {
                break;
            }
            i++;
        }

        if (i <= numNeighboursRight) {
            this.#focussedComponent().focussed = false;
            this._focussedIndex = this._focussedIndex + i;
            this.#focussedComponent().focussed = true;
        }

        AudioPlayer.Next();
    }

    focusNeighbourPrev() {
        if (this._components.length == 0) {
            return;
        }

        let i = 1;
        while (i <= this._focussedIndex) {
            const prevNeighbour = this._components[this._focussedIndex - i];
            if (prevNeighbour.disabled === false) {
                break;
            }
            i++;
        }

        if (i <= this._focussedIndex) {
            this.#focussedComponent().focussed = false;
            this._focussedIndex = this._focussedIndex - i;
            this.#focussedComponent().focussed = true;
        }

        AudioPlayer.Next();
    }

    #focussedComponent() {
        return this._components[this._focussedIndex];
    }
}

class HoriztonalBox extends BoxContainer {
    #itemWidth;

    constructor(x, y, width, height, maxComponents) {
        super(x, y, width, height, maxComponents);

        this.#itemWidth = width / maxComponents;
    }

    addComponent(txt, ctx, onClick = null) {
        const x = this._x + this._components.length * this.#itemWidth;
        super.addComponent(txt, x, this._y, this.#itemWidth, this._height, ctx, onClick);
    }

    setComponent(i, txt, ctx, onClick = null) {
        const x = this._x + i*this.#itemWidth;
        super.setComponent(i, txt, x, this._y, this.#itemWidth, this._height, ctx, onClick);
    }

    keyUp(key) {
        if (this._focussed !== true || this.visible !== true) {
            return;
        }

        switch(key) {
            case Keybind.Accept:
                this.handleAction();
                break;

            case Keybind.Right:
                this.focusNeighbourNext();
                break;

            case Keybind.Left:
                this.focusNeighbourPrev();
                break;
        }
    }
}

class VerticalBox extends BoxContainer {
    #itemHeight;

    constructor(x, y, width, height, maxComponents) {
        super(x, y, width, height, maxComponents);

        this.#itemHeight = height / maxComponents;
    }

    addComponent(txt, ctx, onClick = null) {
        const y = this._y + this._components.length*this.#itemHeight;
        super.addComponent(txt, this._x, y, this._width, this.#itemHeight, ctx, onClick);
    }

    setComponent(i, txt, ctx, onClick = null) {
        const y = this._y + i*this.#itemHeight;
        super.setComponent(i, txt, this._x, y, this._width, this.#itemHeight, ctx, onClick);
    }

    keyUp(key) {
        if (this._focussed !== true || this.visible !== true) {
            return;
        }

        switch(key) {
            case Keybind.Accept:
                this.handleAction();
                break;

            case Keybind.Down:
                this.focusNeighbourNext();
                break;

            case Keybind.Up:
                this.focusNeighbourPrev();
                break;
        }
    }
}