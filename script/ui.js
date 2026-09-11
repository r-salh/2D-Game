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
    Up: "arrowup",
    Left: "arrowleft",
    Down: "arrowdown",
    Right: "arrowright",
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

    clear() {
        this.#text = "";
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

    setFocussedComponent(i) {
        if (!this._focussed) {
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

    getFocussedIndex() {
        return this._focussedIndex;
    }

    isComponentDisabled(i) {
        return this._components[i].disabled;
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

class Grid {
    visible = true;

    border = Theme.Border;
    borderWidth = Theme.LineWidth;
    font = Theme.Font;
    background = Theme.Background;

    #items;
    #content;

    #focussed = false;
    #focussedIndex = 0;
    #focussedCol;

    #rows;
    #cols;
    #colWidth;
    #x;
    #y;
    #width;
    #height;

    constructor(rows, cols, x, y, width, height) {
        this.#rows = rows;
        this.#cols = cols;
        this.#x = x;
        this.#y = y;
        this.#width = width;
        this.#height = height;

        this.#colWidth = width / cols;

        this.clear();
    }

    draw(ctx) {
        if (!this.visible) {
            return;
        }

        if (this.background) {
            ctx.fillStyle = this.background;
            ctx.fillRect(this.#x, this.#y, this.#width, this.#height);
        }

        for (let i = 0; i < this.#content.length; i++) {
            this.#content[i].draw(ctx);
        }

        if (this.border) {
            ctx.strokeStyle = this.border;
            ctx.lineWidth = this.borderWidth;
            ctx.strokeRect(this.#x, this.#y, this.#width, this.#height);
        }
    }

    setFocussed(focussed) {
        this.#focussed = focussed;

        if (!focussed) {
            this.#focussedCol.setFocussed(false);
            return;
        }

        this.#setFocussedComponent(0, 0);
        for (let i = 1; i < this.#content.length; i++) {
            this.#content[i].setFocussed(false);
        }
    }

    addComponent(txt, ctx, onClick = null) {
        const colIndex = Math.floor(this.#items / this.#rows);
        const col = this.#content[colIndex];
        col.addComponent(txt, ctx, onClick);
        this.#items++;
    }

    setComponent(i, txt, ctx, onClick = null) {
        const colIndex = Math.floor(i / this.#rows);
        const col = this.#content[colIndex];
        const rowIndex = i % this.#rows;

        col.setComponent(rowIndex, txt, ctx, onClick);
    }

    setDisabledComponent(i, disabled) {
        const colIndex = Math.floor(i / this.#rows);
        const col = this.#content[colIndex];
        const rowIndex = i % this.#rows;

        col.setDisabledComponent(rowIndex, disabled);
    }

    clear() {
        this.#content = [];
        this.#items = 0;

        for (let i = 0; i < this.#cols; i++) {
            const contX = this.#x + (i * this.#colWidth);
            const vbox = new VerticalBox(contX, this.#y, this.#colWidth, this.#height, this.#rows);
            vbox.border = null;
            vbox.background = null;
            this.#content.push(vbox);
        }

        this.#focussedCol = this.#content[0];
    }

    keyUp(key) {
        if ( !(this.#focussed && this.visible) ) {
            return;
        }

        switch (key) {
            case Keybind.Right:
                this.#focusNextCol();
                break;
            case Keybind.Left:
                this.#focusPrevCol();
                break;
            default:
                this.#focussedCol.keyUp(key);
        }
    }

    #setFocussedComponent(row, col) {
        this.#focussedCol.setFocussed(false);

        this.#focussedIndex = col;
        this.#focussedCol = this.#content[col];

        this.#focussedCol.setFocussed(true);
        this.#focussedCol.setFocussedComponent(row);
    }

    #focusNextCol() {
        const nextColIndex = this.#focussedIndex + 1;

        if (nextColIndex >= this.#content.length) { return }

        const nextCol = this.#content[nextColIndex];
        const focussedRow = this.#getFocussedRow();
        if (nextCol.isComponentDisabled(focussedRow)) {
            return;
        }

        AudioPlayer.Next();
        this.#setFocussedComponent(focussedRow, nextColIndex);
    }

    #focusPrevCol() {
        if (this.#focussedIndex == 0) { return }

        const prevColIndex = this.#focussedIndex - 1;
        const prevCol = this.#content[prevColIndex];
        const focussedRow = this.#getFocussedRow();

        if (prevCol.isComponentDisabled(focussedRow)) {
            return;
        }

        AudioPlayer.Next();
        this.#setFocussedComponent(focussedRow, prevColIndex);
    }

    #getFocussedRow() {
        return this.#focussedCol.getFocussedIndex();
    }
}