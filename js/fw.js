var fw;
class FourWins {
    constructor({ canvasDiv = 'canvasdiv', canvasTag = 'canvas', buttonDiv = 'dropbuttons', meldungDiv = 'meldungdiv' }) {
        this.losten = null;
        this.gravity = null;
        this.velY = null;
        this.bounceCounter = null;
        this.onWindowResize = () => {
            fw.calcPlayfieldParams();
            fw.setChipParams();
            fw.update(this.ctx);
        };
        this.canvasdiv = document.getElementById(canvasDiv);
        this.canvas = document.getElementsByTagName(canvasTag)[0];
        this.ctx = this.canvas.getContext("2d");
        this.canvasBackground = '#2472b9';
        this.buttonDiv = document.getElementById(buttonDiv);
        this.meldungDiv = document.getElementById(meldungDiv);
        this.losten = 0.45;
        this.gravity = 0.25;
        window.addEventListener('resize', this.onWindowResize);
        this.initGame();
    }
    calcPlayfieldParams() {
        this.canvasWidth = this.canvasdiv.getBoundingClientRect().width;
        this.canvasHeight = this.canvasdiv.getBoundingClientRect().height;
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        var border = Math.ceil(this.canvasWidth * 2.8 / 100);
        this.chipPositions = [];
        var chipIndex = 42;
        var topOffset = 55;
        for (var j = 1; j <= 6; j++) {
            for (var i = 7; i >= 1; i--) {
                var x = border + (this.canvasWidth / 7 * i - this.canvasWidth / 10);
                var y = topOffset + ((this.canvasHeight - topOffset) / 6 * j - (this.canvasHeight - topOffset) / 10);
                this.chipPositions[chipIndex] = new Point(x, y);
                chipIndex -= 1;
            }
        }
        this.chipRadius = Math.ceil(this.canvasWidth * 5.6 / 100);
        ;
        this.kreisRadius = this.chipRadius - 1;
        this.droppointArray = [];
        for (var i = 1; i <= 7; i++) {
            this.droppointArray[i] = border + (this.canvasWidth / 7 * i - this.canvasWidth / 10);
        }
    }
    initGame() {
        this.calcPlayfieldParams();
        this.chipArray = [];
        this.chipMatrix = [];
        for (var i = 1; i <= 42; i++) {
            this.chipMatrix[i] = 2;
        }
        this.chipNumber = 0;
        this.player = 0;
        this.computer = 1;
        this.proofbr = true;
        this.curplayer = 0;
        this.winning = false;
        this.numchips = 42;
        this.drawGamescene(this.ctx);
        this.buttonDiv.style.display = 'block';
        this.meldungDiv.innerHTML = 'Insert a chip!';
    }
    chipAnim(chip) {
        if (this.bounceCounter < 4) {
            requestAnimationFrame(() => this.chipAnim(chip));
        }
        else {
            this.chipNumber += 1;
            var status = this.proof();
            if (status === true && this.winning === false) {
                if (this.curplayer == 0) {
                    this.curplayer = 1;
                    this.buttonDiv.style.display = 'none';
                    this.calcnextMove();
                }
                else {
                    this.curplayer = 0;
                    this.buttonDiv.style.display = 'block';
                    this.meldungDiv.innerHTML = "It's your turn.";
                }
            }
            else {
                this.buttonDiv.style.display = 'none';
            }
        }
        if (chip.cCenter.y >= chip.eCenter.y - 2) {
            this.velY *= -this.losten;
            chip.cCenter.y = chip.eCenter.y;
            this.bounceCounter += 1;
        }
        if (chip.cCenter.y <= 0) {
            this.velY *= -this.losten;
            chip.cCenter.y = chip.radius;
        }
        if (this.velY < 0.01 && this.velY > -0.01) {
            this.velY = 0;
        }
        this.velY += this.gravity;
        chip.cCenter.y += this.velY;
        this.update(this.ctx);
    }
    dropChip(dropIndex) {
        var endposIndex = this.searchFreeposition(dropIndex);
        if (endposIndex > 0) {
            this.buttonDiv.style.display = 'none';
            this.meldungDiv.innerHTML = '';
            var startCenter = new Point(this.droppointArray[dropIndex], 28);
            var endCenter = this.chipPositions[endposIndex];
            var colorNumber = this.curplayer;
            this.numchips -= 1;
            this.chipMatrix[endposIndex] = this.curplayer;
            var chip = new Chip(startCenter, endCenter, this.chipRadius, colorNumber, endposIndex);
            this.chipArray[this.chipNumber] = chip;
            this.velY = 0.25;
            this.bounceCounter = 0;
            this.chipAnim(this.chipArray[this.chipNumber]);
        }
    }
    drawGamescene(ctx) {
        ctx.fillStyle = this.canvasBackground;
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.chipPositions.forEach(element => {
            var center = element;
            var c = new Kreis(center, this.kreisRadius, 0, 2 * Math.PI, '#f0f0f0', '', 1, 'fill');
            c.draw(ctx);
        });
    }
    drawChips(ctx) {
        this.chipArray.forEach(element => {
            element.draw(ctx);
        });
    }
    searchFreeposition(dropIndex) {
        for (var i = dropIndex; i <= 42; i += 7) {
            if (this.chipMatrix[i] == 2)
                return i;
        }
        return 0;
    }
    proof() {
        var counter, i, j, n, m, chip, compchip;
        i = 1;
        for (n = 1; n <= 6; n++) {
            counter = 0;
            for (j = i + 1; j <= i + 6; j++) {
                chip = this.chipMatrix[j - 1];
                compchip = this.chipMatrix[j];
                if ((chip != 2) && (chip == compchip)) {
                    counter += 1;
                    if (counter == 3) {
                        this.winning = true;
                        if (chip == 0) {
                            this.meldungDiv.innerHTML = "<b>You won!</b>";
                        }
                        else {
                            this.meldungDiv.innerHTML = "<b>The computer won!</b>";
                        }
                        return false;
                    }
                }
                else {
                    counter = 0;
                }
            }
            i += 7;
        }
        for (n = 1; n <= 7; n++) {
            counter = 0;
            i = n + 7;
            while (i < n + (5 * 7) + 1) {
                chip = this.chipMatrix[i - 7];
                compchip = this.chipMatrix[i];
                if ((chip != 2) && (chip == compchip)) {
                    counter += 1;
                    if (counter == 3) {
                        this.winning = true;
                        if (chip == 0) {
                            this.meldungDiv.innerHTML = "<b>You won!</b>";
                        }
                        else {
                            this.meldungDiv.innerHTML = "<b>The computer won!</b>";
                        }
                        return false;
                    }
                }
                else {
                    counter = 0;
                }
                i += 7;
            }
        }
        i = 1;
        while (i <= 15) {
            for (j = i; j <= i + 3; j++) {
                chip = this.chipMatrix[j];
                if (chip != 2) {
                    counter = 0;
                    for (m = 1; m <= 3; m++) {
                        compchip = this.chipMatrix[j + (m * 8)];
                        if (chip == compchip) {
                            counter += 1;
                            if (counter == 3) {
                                this.winning = true;
                                if (chip == 0) {
                                    this.meldungDiv.innerHTML = "<b>You won!</b>";
                                }
                                else {
                                    this.meldungDiv.innerHTML = "<b>The computer won!</b>";
                                }
                                return false;
                            }
                        }
                        else {
                            counter = 0;
                        }
                    }
                }
            }
            i += 7;
        }
        i = 4;
        while (i <= 18) {
            for (j = i; j <= i + 3; j++) {
                chip = this.chipMatrix[j];
                if (chip != 2) {
                    counter = 0;
                    for (m = 1; m <= 3; m++) {
                        compchip = this.chipMatrix[j + (m * 6)];
                        if (chip == compchip) {
                            counter += 1;
                            if (counter == 3) {
                                this.winning = true;
                                if (chip == 0) {
                                    this.meldungDiv.innerHTML = "<b>You won!</b>";
                                }
                                else {
                                    this.meldungDiv.innerHTML = "<b>The computer won!</b>";
                                }
                                return false;
                            }
                        }
                        else {
                            counter = 0;
                        }
                    }
                }
            }
            i += 7;
        }
        if ((this.numchips == 0) && (this.winning === false)) {
            this.meldungDiv.innerHTML = "<b>The game is a tie!</b>";
            return false;
        }
        if (this.winning === true) {
            return false;
        }
        return true;
    }
    calcDropcolumn(chippos) {
        if (chippos > 7) {
            var i = Math.floor(chippos / 7);
            var dropRow = chippos - (i * 7);
            if (dropRow == 0)
                dropRow = 7;
        }
        else
            dropRow = chippos;
        return dropRow;
    }
    calcnextMove() {
        var counter, i, j, n, m, r, s, chip, compchip, chipset, pos, winflag;
        this.priorityMatrix = [];
        for (i = 1; i <= 42; i++) {
            this.priorityMatrix[i] = 0;
        }
        for (i = 1; i <= 7; i++) {
            if (this.chipMatrix[i] == 2)
                this.priorityMatrix[i] = 1;
        }
        winflag = false;
        i = 1;
        for (n = 1; n <= 6; n++) {
            counter = 0;
            for (j = i; j <= i + 4; j++) {
                chip = this.chipMatrix[j];
                if (chip == this.computer) {
                    compchip = this.chipMatrix[j + 1];
                    if (compchip == chip) {
                        counter += 1;
                        if (counter == 2 && this.chipMatrix[j + 2] == 2) {
                            if (n > 1) {
                                if (this.chipMatrix[j + 2 - 7] != 2) {
                                    this.priorityMatrix[j + 2] = 12;
                                    winflag = true;
                                }
                            }
                            else {
                                this.priorityMatrix[j + 2] = 12;
                                winflag = true;
                            }
                        }
                    }
                    else {
                        counter = 0;
                    }
                }
            }
            i += 7;
        }
        i = 7;
        for (n = 1; n <= 6; n++) {
            counter = 0;
            for (j = i; j >= i - 4; j--) {
                chip = this.chipMatrix[j];
                if (chip == this.computer) {
                    compchip = this.chipMatrix[j - 1];
                    if (compchip == chip) {
                        counter += 1;
                        if (counter == 2 && this.chipMatrix[j - 2] == 2) {
                            if (n > 1) {
                                if (this.chipMatrix[j - 2 - 7] != 2) {
                                    this.priorityMatrix[j - 2] = 12;
                                    winflag = true;
                                }
                            }
                            else {
                                this.priorityMatrix[j - 2] = 12;
                                winflag = true;
                            }
                        }
                    }
                    else {
                        counter = 0;
                    }
                }
            }
            i += 7;
        }
        for (n = 1; n <= 7; n++) {
            counter = 0;
            i = n + 7;
            while (i <= n + (4 * 7) + 1) {
                chip = this.chipMatrix[i - 7];
                compchip = this.chipMatrix[i];
                if (chip == this.computer && chip == compchip) {
                    counter += 1;
                    if (counter == 2 && this.chipMatrix[i + 7] == 2) {
                        this.priorityMatrix[i + 7] = 12;
                        winflag = true;
                    }
                }
                else {
                    counter = 0;
                }
                i += 7;
            }
        }
        i = 1;
        while (i <= 15) {
            for (j = i; j <= i + 3; j++) {
                chip = this.chipMatrix[j];
                if (chip == this.computer) {
                    counter = 0;
                    for (m = 1; m <= 2; m++) {
                        compchip = this.chipMatrix[j + (m * 8)];
                        if (chip == compchip) {
                            counter += 1;
                            if (counter == 2 && this.chipMatrix[j + (m * 8) + 8 - 7] != 2 && this.chipMatrix[j + ((m + 1) * 8)] == 2) {
                                this.priorityMatrix[j + ((m + 1) * 8)] = 12;
                                winflag = true;
                            }
                        }
                        else {
                            counter = 0;
                        }
                    }
                }
            }
            i += 7;
        }
        i = 22;
        while (i <= 36) {
            for (j = i; j <= i + 3; j++) {
                chip = this.chipMatrix[j];
                if (chip == this.computer) {
                    counter = 0;
                    for (m = 1; m <= 2; m++) {
                        compchip = this.chipMatrix[j - (m * 6)];
                        if (chip == compchip) {
                            counter += 1;
                            if (counter == 2 && this.chipMatrix[j - (m * 6) - 6] == 2) {
                                if (i > 22) {
                                    if (this.chipMatrix[j - (m * 6) - 6 - 7] != 2) {
                                        this.priorityMatrix[j - (m * 6) - 6] = 12;
                                        winflag = true;
                                    }
                                }
                                else {
                                    this.priorityMatrix[j - (m * 6) - 6] = 12;
                                    winflag = true;
                                }
                            }
                        }
                        else {
                            counter = 0;
                        }
                    }
                }
            }
            i += 7;
        }
        i = 4;
        while (i <= 18) {
            for (j = i; j <= i + 3; j++) {
                chip = this.chipMatrix[j];
                if (chip == this.computer) {
                    counter = 0;
                    for (m = 1; m <= 2; m++) {
                        compchip = this.chipMatrix[j + (m * 6)];
                        if (chip == compchip) {
                            counter += 1;
                            if (counter == 2 && this.chipMatrix[j + (m * 6) + 6 - 7] != 2 && this.chipMatrix[j + ((m + 1) * 6)] == 2) {
                                this.priorityMatrix[j + ((m + 1) * 6)] = 12;
                                winflag = true;
                            }
                        }
                        else {
                            counter = 0;
                        }
                    }
                }
            }
            i += 7;
        }
        i = 25;
        while (i <= 39) {
            for (j = i; j <= i + 3; j++) {
                chip = this.chipMatrix[j];
                if (chip == this.computer) {
                    counter = 0;
                    for (m = 1; m <= 2; m++) {
                        compchip = this.chipMatrix[j - (m * 8)];
                        if (chip == compchip) {
                            counter += 1;
                            if (counter == 2 && this.chipMatrix[j - (m * 8) - 8] == 2) {
                                if (i > 25) {
                                    if (this.chipMatrix[j - (m * 8) - 8 - 7] != 2) {
                                        this.priorityMatrix[j - (m * 8) - 8] = 12;
                                        winflag = true;
                                    }
                                }
                                else {
                                    this.priorityMatrix[j - (m * 8) - 8] = 12;
                                    winflag = true;
                                }
                            }
                        }
                        else {
                            counter = 0;
                        }
                    }
                }
            }
            i += 7;
        }
        for (r = 0; r <= 5; r++) {
            for (s = 3; s <= 6; s++) {
                pos = r * 7 + s;
                if (this.chipMatrix[pos - 1] == this.computer && this.chipMatrix[pos - 2] == this.computer && this.chipMatrix[pos + 1] == this.computer && this.chipMatrix[pos] == 2) {
                    if (r > 0) {
                        if (this.chipMatrix[pos - 7] != 2) {
                            this.priorityMatrix[pos] = 12;
                            winflag = true;
                        }
                    }
                    else {
                        this.priorityMatrix[pos] = 12;
                        winflag = true;
                    }
                }
            }
        }
        for (r = 0; r <= 5; r++) {
            for (s = 2; s <= 5; s++) {
                pos = r * 7 + s;
                if (this.chipMatrix[pos - 1] == this.computer && this.chipMatrix[pos + 1] == this.computer && this.chipMatrix[pos + 2] == this.computer && this.chipMatrix[pos] == 2) {
                    if (r > 0) {
                        if (this.chipMatrix[pos - 7] != 2) {
                            this.priorityMatrix[pos] = 12;
                            winflag = true;
                        }
                    }
                    else {
                        this.priorityMatrix[pos] = 12;
                        winflag = true;
                    }
                }
            }
        }
        for (s = 1; s <= 7; s++) {
            for (r = 1; r <= 3; r++) {
                pos = s + r * 7;
                if (this.chipMatrix[pos - 7] == this.computer && this.chipMatrix[pos + 7] == this.computer && this.chipMatrix[pos + 14] == this.computer && this.chipMatrix[pos] == 2 && this.chipMatrix[pos - 7] != 2) {
                    this.priorityMatrix[pos] = 12;
                    winflag = true;
                }
            }
        }
        for (s = 1; s <= 7; s++) {
            for (r = 2; r <= 4; r++) {
                pos = s + r * 7;
                if (this.chipMatrix[pos - 7] == this.computer && this.chipMatrix[pos - 14] == this.computer && this.chipMatrix[pos + 7] == this.computer && this.chipMatrix[pos] == 2 && this.chipMatrix[pos - 7] != 2) {
                    this.priorityMatrix[pos] = 12;
                    winflag = true;
                }
            }
        }
        for (r = 1; r <= 3; r++) {
            for (s = 2; s <= 5; s++) {
                pos = r * 7 + s;
                if (this.chipMatrix[pos - 8] == this.computer && this.chipMatrix[pos + 8] == this.computer && this.chipMatrix[pos + 16] == this.computer && this.chipMatrix[pos] == 2 && this.chipMatrix[pos - 7] != 2) {
                    this.priorityMatrix[pos] = 12;
                    winflag = true;
                }
            }
        }
        for (r = 2; r <= 4; r++) {
            for (s = 3; s <= 6; s++) {
                pos = r * 7 + s;
                if (this.chipMatrix[pos - 8] == this.computer && this.chipMatrix[pos - 16] == this.computer && this.chipMatrix[pos + 8] == this.computer && this.chipMatrix[pos] == 2 && this.chipMatrix[pos - 7] != 2) {
                    this.priorityMatrix[pos] = 12;
                    winflag = true;
                }
            }
        }
        for (r = 1; r <= 3; r++) {
            for (s = 3; s <= 6; s++) {
                pos = r * 7 + s;
                if (this.chipMatrix[pos - 6] == this.computer && this.chipMatrix[pos + 6] == this.computer && this.chipMatrix[pos + 12] == this.computer && this.chipMatrix[pos] == 2 && this.chipMatrix[pos - 7] != 2) {
                    this.priorityMatrix[pos] = 12;
                    winflag = true;
                }
            }
        }
        for (r = 2; r <= 4; r++) {
            for (s = 2; s <= 5; s++) {
                pos = r * 7 + s;
                if (this.chipMatrix[pos - 6] == this.computer && this.chipMatrix[pos - 12] == this.computer && this.chipMatrix[pos + 6] == this.computer && this.chipMatrix[pos] == 2 && this.chipMatrix[pos - 7] != 2) {
                    this.priorityMatrix[pos] = 12;
                    winflag = true;
                }
            }
        }
        if (winflag === false) {
            if (this.proofbr === true) {
                if (this.chipMatrix[4] == 2) {
                    this.priorityMatrix[4] = 9;
                }
            }
            if (this.proofbr === true) {
                m = 0;
                for (i = 1; i <= 5; i++) {
                    if (this.chipMatrix[i] == this.player && this.chipMatrix[i + 2] == this.player && this.chipMatrix[i + 1] == 2) {
                        if (i >= 1 && i <= 4 && this.chipMatrix[i - 1] == 2 && this.chipMatrix[i + 3] == 2)
                            m = i + 1;
                    }
                }
                if (m > 0) {
                    this.priorityMatrix[m] = 10;
                }
            }
            if (this.proofbr === true) {
                for (i = 2; i <= 5; i++) {
                    if (this.chipMatrix[i] == this.player && this.chipMatrix[i + 1] == this.player && this.chipMatrix[i + 2] == 2 && this.chipMatrix[i - 1] == 2) {
                        if (Math.round(Math.random()) == 0) {
                            m = i - 1;
                        }
                        else {
                            m = i + 2;
                        }
                        this.priorityMatrix[m] = 10;
                    }
                }
            }
            if (this.proofbr === true) {
                j = true;
                for (i = 1; i <= 7; i++) {
                    if (this.chipMatrix[i] == 2) {
                        j = false;
                    }
                }
                if (j === true) {
                    this.proofbr = false;
                }
            }
            n = 8;
            while (n <= 36) {
                for (i = n; i <= n + 6; i++) {
                    if (this.chipMatrix[i] == 2 && this.chipMatrix[i - 7] != 2) {
                        this.priorityMatrix[i] = 1;
                    }
                }
                n += 7;
            }
            for (n = 2; n <= 6; n++) {
                i = n + 7;
                while (i < n + (4 * 7) + 1) {
                    chip = this.chipMatrix[i - 7];
                    compchip = this.chipMatrix[i];
                    if (chip == this.player && compchip == 2) {
                        this.priorityMatrix[i] = 1;
                    }
                    i += 7;
                }
            }
            i = 8;
            for (n = 1; n <= 7; n++) {
                while (i <= 36) {
                    if (this.chipMatrix[i] == this.computer && this.chipMatrix[i + 1] == 2 && this.chipMatrix[i + 1 - 7] != 2) {
                        this.priorityMatrix[i + 1] = 2;
                    }
                    i += 7;
                }
            }
            i = 1;
            for (n = 1; n <= 6; n++) {
                for (j = i; j <= i + 4; j++) {
                    chip = this.chipMatrix[j];
                    if (chip == this.computer) {
                        compchip = this.chipMatrix[j + 1];
                        if (compchip == chip) {
                            if (this.chipMatrix[j + 2] == 2) {
                                if (n > 1) {
                                    if (this.chipMatrix[j + 2 - 7] != 2) {
                                        this.priorityMatrix[j + 2] = 3;
                                    }
                                }
                                else {
                                    this.priorityMatrix[j + 2] = 3;
                                }
                            }
                        }
                    }
                }
                i += 7;
            }
            i = 7;
            for (n = 1; n <= 6; n++) {
                for (j = i; j >= i - 4; j--) {
                    chip = this.chipMatrix[j];
                    if (chip == this.computer) {
                        compchip = this.chipMatrix[j - 1];
                        if (compchip == chip) {
                            if (this.chipMatrix[j - 2] == 2) {
                                if (n > 1) {
                                    if (this.chipMatrix[j - 2 - 7] != 2) {
                                        this.priorityMatrix[j - 2] = 3;
                                    }
                                }
                                else {
                                    this.priorityMatrix[j - 2] = 3;
                                }
                            }
                        }
                    }
                }
                i += 7;
            }
            for (n = 1; n <= 7; n++) {
                i = n + 7;
                while (i < n + (4 * 7) + 1) {
                    chip = this.chipMatrix[i - 7];
                    compchip = this.chipMatrix[i];
                    if (chip == this.computer && chip == compchip) {
                        if (this.chipMatrix[i + 7] == 2) {
                            if (n > 1) {
                                if (this.chipMatrix[i] != 2) {
                                    this.priorityMatrix[i + 7] = 3;
                                }
                            }
                            else {
                                this.priorityMatrix[i + 7] = 3;
                            }
                        }
                    }
                    i += 7;
                }
            }
            i = 1;
            while (i <= 15) {
                for (j = i; j <= i + 3; j++) {
                    chip = this.chipMatrix[j];
                    if (chip == this.computer) {
                        compchip = this.chipMatrix[j + 8];
                        if (chip == compchip) {
                            if (this.chipMatrix[j + 16 - 7] != 2 && this.chipMatrix[j + 16] == 2) {
                                this.priorityMatrix[j + 16] = 3;
                            }
                        }
                    }
                }
                i += 7;
            }
            i = 22;
            while (i <= 36) {
                for (j = i; j <= i + 3; j++) {
                    chip = this.chipMatrix[j];
                    if (chip == this.computer) {
                        compchip = this.chipMatrix[j - 6];
                        if (chip == compchip) {
                            if (this.chipMatrix[j - 12] == 2 && this.chipMatrix[j - 12 - 7] != 2) {
                                this.priorityMatrix[j - 12] = 3;
                            }
                        }
                    }
                }
                i += 7;
            }
            i = 4;
            while (i <= 18) {
                for (j = i; j <= i + 3; j++) {
                    chip = this.chipMatrix[j];
                    if (chip == this.computer) {
                        compchip = this.chipMatrix[j + 6];
                        if (chip == compchip) {
                            if (this.chipMatrix[j + 12 - 7] != 2 && this.chipMatrix[j + 12] == 2) {
                                this.priorityMatrix[j + 12] = 3;
                            }
                        }
                    }
                }
                i += 7;
            }
            i = 25;
            while (i <= 39) {
                for (j = i; j <= i + 3; j++) {
                    chip = this.chipMatrix[j];
                    if (chip == this.computer) {
                        compchip = this.chipMatrix[j - 8];
                        if (chip == compchip) {
                            if (this.chipMatrix[j - 16] == 2 && this.chipMatrix[j - 16 - 7] != 2) {
                                this.priorityMatrix[j - 16] = 3;
                            }
                        }
                    }
                }
                i += 7;
            }
            n = 4;
            i = n + 7;
            while (i < n + (4 * 7) + 1) {
                if (this.chipMatrix[i - 7] == this.player && this.chipMatrix[i] == 2) {
                    this.priorityMatrix[i] = 4;
                }
                i += 7;
            }
            i = 1;
            while (i <= 36) {
                for (j = i; j <= i + 5; j++) {
                    chip = this.chipMatrix[j];
                    if (chip == this.player) {
                        compchip = this.chipMatrix[j + 2];
                        if (chip == compchip) {
                            if (this.chipMatrix[j + 1] == 2) {
                                if (i > 1) {
                                    if (this.chipMatrix[j + 1 - 7] != 2) {
                                        this.priorityMatrix[j + 1] = 5;
                                    }
                                }
                                else {
                                    if (j <= i + 4 && this.chipMatrix[j + 3] == this.player)
                                        this.priorityMatrix[j + 1] = 5;
                                }
                            }
                        }
                    }
                }
                i += 7;
            }
            i = 1;
            while (i <= 22) {
                for (j = i; j <= i + 4; j++) {
                    chip = this.chipMatrix[j];
                    if (chip == this.player) {
                        compchip = this.chipMatrix[j + 16];
                        if (chip == compchip) {
                            if (this.chipMatrix[j + 1] != 2 && this.chipMatrix[j + 8] == 2) {
                                this.priorityMatrix[j + 8] = 5;
                            }
                        }
                    }
                }
                i += 7;
            }
            i = 3;
            while (i <= 24) {
                for (j = i; j <= i + 4; j++) {
                    chip = this.chipMatrix[j];
                    if (chip == this.player) {
                        compchip = this.chipMatrix[j + 12];
                        if (chip == compchip) {
                            if (this.chipMatrix[j - 1] != 2 && this.chipMatrix[j + 6] == 2) {
                                this.priorityMatrix[j + 6] = 5;
                            }
                        }
                    }
                }
                i += 7;
            }
            i = 1;
            for (n = 1; n <= 6; n++) {
                for (j = i; j <= i + 4; j++) {
                    chip = this.chipMatrix[j];
                    if (chip == this.player) {
                        compchip = this.chipMatrix[j + 1];
                        if (compchip == chip) {
                            if (this.chipMatrix[j + 2] == 2) {
                                if (i > 1) {
                                    if (this.chipMatrix[j + 2 - 7] != 2) {
                                        this.priorityMatrix[j + 2] = 6;
                                    }
                                }
                                else {
                                    this.priorityMatrix[j + 2] = 6;
                                }
                            }
                        }
                    }
                }
                i += 7;
            }
            i = 7;
            for (n = 1; n <= 6; n++) {
                for (j = i; j >= i - 4; j--) {
                    chip = this.chipMatrix[j];
                    if (chip == this.player) {
                        compchip = this.chipMatrix[j - 1];
                        if (compchip == chip) {
                            if (this.chipMatrix[j - 2] == 2) {
                                if (i > 7) {
                                    if (this.chipMatrix[j - 2 - 7] != 2) {
                                        this.priorityMatrix[j - 2] = 6;
                                    }
                                }
                                else {
                                    this.priorityMatrix[j - 2] = 6;
                                }
                            }
                        }
                    }
                }
                i += 7;
            }
            for (n = 1; n <= 7; n++) {
                i = n + 7;
                while (i < n + (4 * 7) + 1) {
                    chip = this.chipMatrix[i - 7];
                    compchip = this.chipMatrix[i];
                    if (chip == this.player && chip == compchip) {
                        if (this.chipMatrix[i + 7] == 2) {
                            if (n > 1) {
                                if (this.chipMatrix[i] != 2) {
                                    this.priorityMatrix[i + 7] = 6;
                                }
                            }
                            else {
                                this.priorityMatrix[i + 7] = 6;
                            }
                        }
                    }
                    i += 7;
                }
            }
            i = 1;
            while (i <= 15) {
                for (j = i; j <= i + 3; j++) {
                    chip = this.chipMatrix[j];
                    if (chip == this.player) {
                        compchip = this.chipMatrix[j + 8];
                        if (chip == compchip) {
                            if (this.chipMatrix[j + 16 - 7] != 2 && this.chipMatrix[j + 16] == 2) {
                                this.priorityMatrix[j + 16] = 6;
                            }
                        }
                    }
                }
                i += 7;
            }
            i = 22;
            while (i <= 36) {
                for (j = i; j <= i + 3; j++) {
                    chip = this.chipMatrix[j];
                    if (chip == this.player) {
                        compchip = this.chipMatrix[j - 6];
                        if (chip == compchip) {
                            if (this.chipMatrix[j - 12] == 2 && this.chipMatrix[j - 12 - 7] != 2) {
                                this.priorityMatrix[j - 12] = 6;
                            }
                        }
                    }
                }
                i += 7;
            }
            i = 4;
            while (i <= 18) {
                for (j = i; j <= i + 3; j++) {
                    chip = this.chipMatrix[j];
                    if (chip == this.player) {
                        compchip = this.chipMatrix[j + 6];
                        if (chip == compchip) {
                            if (this.chipMatrix[j + 12 - 7] != 2 && this.chipMatrix[j + 12] == 2) {
                                this.priorityMatrix[j + 12] = 6;
                            }
                        }
                    }
                }
                i += 7;
            }
            i = 25;
            while (i <= 39) {
                for (j = i; j <= i + 3; j++) {
                    chip = this.chipMatrix[j];
                    if (chip == this.player) {
                        compchip = this.chipMatrix[j - 8];
                        if (chip == compchip) {
                            if (this.chipMatrix[j - 16] == 2 && this.chipMatrix[j - 16 - 7] != 2) {
                                this.priorityMatrix[j - 16] = 6;
                            }
                        }
                    }
                }
                i += 7;
            }
            i = 22;
            while (i <= 36) {
                for (j = i; j <= i + 3; j++) {
                    chip = this.chipMatrix[j];
                    if (chip == this.player) {
                        compchip = this.chipMatrix[j - 6];
                        if (chip == compchip) {
                            if (this.chipMatrix[j - 12] == 2 && this.chipMatrix[j - 18] == 2) {
                                if (i > 22) {
                                    if (this.chipMatrix[j - 18 - 7] != 2) {
                                        this.priorityMatrix[j - 18] = 7;
                                    }
                                }
                                else {
                                    this.priorityMatrix[j - 18] = 7;
                                }
                            }
                        }
                    }
                }
                i += 7;
            }
            i = 25;
            while (i <= 42) {
                for (j = i; j <= i + 3; j++) {
                    chip = this.chipMatrix[j];
                    if (chip == this.player) {
                        compchip = this.chipMatrix[j - 8];
                        if (chip == compchip) {
                            if (this.chipMatrix[j - 16] == 2 && this.chipMatrix[j - 24] == 2) {
                                if (i > 25) {
                                    if (this.chipMatrix[j - 24 - 7] != 2) {
                                        this.priorityMatrix[j - 24] = 7;
                                    }
                                }
                                else {
                                    this.priorityMatrix[j - 24] = 7;
                                }
                            }
                        }
                    }
                }
                i += 7;
            }
            i = 22;
            while (i <= 36) {
                for (j = i; j <= i + 4; j++) {
                    chip = this.chipMatrix[j];
                    if (chip == this.computer) {
                        compchip = this.chipMatrix[j - 6];
                        if (chip == compchip) {
                            if (this.chipMatrix[j - 12] == 2 && this.chipMatrix[j - 18] == 2) {
                                if (i > 22) {
                                    if (this.chipMatrix[j - 18 - 7] != 2) {
                                        this.priorityMatrix[j - 18] = 8;
                                    }
                                }
                                else {
                                    this.priorityMatrix[j - 18] = 8;
                                }
                            }
                        }
                    }
                }
                i += 7;
            }
            i = 25;
            while (i <= 42) {
                for (j = i; j <= i + 4; j++) {
                    chip = this.chipMatrix[j];
                    if (chip == this.computer) {
                        compchip = this.chipMatrix[j - 8];
                        if (chip == compchip) {
                            if (this.chipMatrix[j - 16] == 2 && this.chipMatrix[j - 24] == 2) {
                                if (i > 25) {
                                    if (this.chipMatrix[j - 24 - 7] != 2) {
                                        this.priorityMatrix[j - 24] = 8;
                                    }
                                }
                                else {
                                    this.priorityMatrix[j - 24] = 8;
                                }
                            }
                        }
                    }
                }
                i += 7;
            }
            i = 1;
            for (n = 1; n <= 6; n++) {
                counter = 0;
                for (j = i; j <= i + 4; j++) {
                    chip = this.chipMatrix[j];
                    if (chip == this.player) {
                        compchip = this.chipMatrix[j + 1];
                        if (compchip == chip) {
                            counter += 1;
                            if (counter == 2 && this.chipMatrix[j + 2] == 2) {
                                if (n > 1) {
                                    if (this.chipMatrix[j + 2 - 7] != 2) {
                                        this.priorityMatrix[j + 2] = 9;
                                    }
                                }
                                else {
                                    this.priorityMatrix[j + 2] = 9;
                                }
                            }
                        }
                        else {
                            counter = 0;
                        }
                    }
                }
                i += 7;
            }
            i = 7;
            for (n = 1; n <= 6; n++) {
                counter = 0;
                for (j = i; j >= i - 4; j--) {
                    chip = this.chipMatrix[j];
                    if (chip == this.player) {
                        compchip = this.chipMatrix[j - 1];
                        if (compchip == chip) {
                            counter += 1;
                            if (counter == 2 && this.chipMatrix[j - 2] == 2) {
                                if (n > 1) {
                                    if (this.chipMatrix[j - 2 - 7] != 2) {
                                        this.priorityMatrix[j - 2] = 9;
                                    }
                                }
                                else {
                                    this.priorityMatrix[j - 2] = 9;
                                }
                            }
                        }
                        else {
                            counter = 0;
                        }
                    }
                }
                i += 7;
            }
            for (n = 1; n <= 7; n++) {
                counter = 0;
                i = n + 7;
                while (i < n + (4 * 7) + 1) {
                    chip = this.chipMatrix[i - 7];
                    compchip = this.chipMatrix[i];
                    if (chip == this.player && chip == compchip) {
                        counter += 1;
                        if (counter == 2 && this.chipMatrix[i + 7] == 2) {
                            if (n > 1) {
                                if (this.chipMatrix[i] != 2) {
                                    this.priorityMatrix[i + 7] = 9;
                                }
                            }
                            else {
                                this.priorityMatrix[i + 7] = 9;
                            }
                        }
                    }
                    else {
                        counter = 0;
                    }
                    i += 7;
                }
            }
            i = 1;
            while (i <= 15) {
                for (j = i; j <= i + 3; j++) {
                    chip = this.chipMatrix[j];
                    if (chip == this.player) {
                        counter = 0;
                        for (m = 1; m <= 2; m++) {
                            compchip = this.chipMatrix[j + (m * 8)];
                            if (chip == compchip) {
                                counter += 1;
                                if (counter == 2 && this.chipMatrix[j + (m * 8) + 8 - 7] != 2 && this.chipMatrix[j + ((m + 1) * 8)] == 2) {
                                    this.priorityMatrix[j + ((m + 1) * 8)] = 9;
                                }
                            }
                            else {
                                counter = 0;
                            }
                        }
                    }
                }
                i += 7;
            }
            i = 22;
            while (i <= 36) {
                for (j = i; j <= i + 3; j++) {
                    chip = this.chipMatrix[j];
                    if (chip == this.player) {
                        counter = 0;
                        for (m = 1; m <= 2; m++) {
                            compchip = this.chipMatrix[j - (m * 6)];
                            if (chip == compchip) {
                                counter += 1;
                                if (counter == 2 && this.chipMatrix[j - (m * 6) - 6] == 2) {
                                    if (i > 22) {
                                        if (this.chipMatrix[j - (m * 6) - 6 - 7] != 2) {
                                            this.priorityMatrix[j - (m * 6) - 6] = 9;
                                        }
                                    }
                                    else {
                                        this.priorityMatrix[j - (m * 6) - 6] = 9;
                                    }
                                }
                            }
                            else {
                                counter = 0;
                            }
                        }
                    }
                }
                i += 7;
            }
            i = 4;
            while (i <= 18) {
                for (j = i; j <= i + 3; j++) {
                    chip = this.chipMatrix[j];
                    if (chip == this.player) {
                        counter = 0;
                        for (m = 1; m <= 2; m++) {
                            compchip = this.chipMatrix[j + (m * 6)];
                            if (chip == compchip) {
                                counter += 1;
                                if (counter == 2 && this.chipMatrix[j + (m * 6) + 6 - 7] != 2 && this.chipMatrix[j + ((m + 1) * 6)] == 2) {
                                    this.priorityMatrix[j + ((m + 1) * 6)] = 9;
                                }
                            }
                            else {
                                counter = 0;
                            }
                        }
                    }
                }
                i += 7;
            }
            i = 25;
            while (i <= 39) {
                for (j = i; j <= i + 3; j++) {
                    chip = this.chipMatrix[j];
                    if (chip == this.player) {
                        counter = 0;
                        for (m = 1; m <= 2; m++) {
                            compchip = this.chipMatrix[j - (m * 8)];
                            if (chip == compchip) {
                                counter += 1;
                                if (counter == 2 && this.chipMatrix[j - (m * 8) - 8] == 2) {
                                    if (i > 25) {
                                        if (this.chipMatrix[j - (m * 8) - 8 - 7] != 2) {
                                            this.priorityMatrix[j - (m * 8) - 8] = 9;
                                        }
                                    }
                                    else {
                                        this.priorityMatrix[j - (m * 8) - 8] = 9;
                                    }
                                }
                            }
                            else {
                                counter = 0;
                            }
                        }
                    }
                }
                i += 7;
            }
            for (r = 0; r <= 5; r++) {
                for (s = 3; s <= 6; s++) {
                    pos = r * 7 + s;
                    if (this.chipMatrix[pos - 1] == this.player && this.chipMatrix[pos - 2] == this.player && this.chipMatrix[pos + 1] == this.player && this.chipMatrix[pos] == 2) {
                        if (r > 0) {
                            if (this.chipMatrix[pos - 7] != 2) {
                                this.priorityMatrix[pos] = 10;
                            }
                        }
                        else {
                            this.priorityMatrix[pos] = 10;
                        }
                    }
                }
            }
            for (r = 0; r <= 5; r++) {
                for (s = 2; s <= 5; s++) {
                    pos = r * 7 + s;
                    if (this.chipMatrix[pos - 1] == this.player && this.chipMatrix[pos + 1] == this.player && this.chipMatrix[pos + 2] == this.player && this.chipMatrix[pos] == 2) {
                        if (r > 0) {
                            if (this.chipMatrix[pos - 7] != 2) {
                                this.priorityMatrix[pos] = 10;
                            }
                        }
                        else {
                            this.priorityMatrix[pos] = 10;
                        }
                    }
                }
            }
            for (s = 1; s <= 7; s++) {
                for (r = 1; r <= 3; r++) {
                    pos = s + r * 7;
                    if (this.chipMatrix[pos - 7] == this.player && this.chipMatrix[pos + 7] == this.player && this.chipMatrix[pos + 14] == this.player && this.chipMatrix[pos] == 2 && this.chipMatrix[pos - 7] != 2) {
                        this.priorityMatrix[pos] = 10;
                    }
                }
            }
            for (s = 1; s <= 7; s++) {
                for (r = 2; r <= 4; r++) {
                    pos = s + r * 7;
                    if (this.chipMatrix[pos - 7] == this.player && this.chipMatrix[pos - 14] == this.player && this.chipMatrix[pos + 7] == this.player && this.chipMatrix[pos] == 2 && this.chipMatrix[pos - 7] != 2) {
                        this.priorityMatrix[pos] = 10;
                    }
                }
            }
            for (r = 1; r <= 3; r++) {
                for (s = 2; s <= 5; s++) {
                    pos = r * 7 + s;
                    if (this.chipMatrix[pos - 8] == this.player && this.chipMatrix[pos + 8] == this.player && this.chipMatrix[pos + 16] == this.player && this.chipMatrix[pos] == 2 && this.chipMatrix[pos - 7] != 2) {
                        this.priorityMatrix[pos] = 10;
                    }
                }
            }
            for (r = 2; r <= 4; r++) {
                for (s = 3; s <= 6; s++) {
                    pos = r * 7 + s;
                    if (this.chipMatrix[pos - 8] == this.player && this.chipMatrix[pos - 16] == this.player && this.chipMatrix[pos + 8] == this.player && this.chipMatrix[pos] == 2 && this.chipMatrix[pos - 7] != 2) {
                        this.priorityMatrix[pos] = 10;
                    }
                }
            }
            for (r = 1; r <= 3; r++) {
                for (s = 3; s <= 6; s++) {
                    pos = r * 7 + s;
                    if (this.chipMatrix[pos - 6] == this.player && this.chipMatrix[pos + 6] == this.player && this.chipMatrix[pos + 12] == this.player && this.chipMatrix[pos] == 2 && this.chipMatrix[pos - 7] != 2) {
                        this.priorityMatrix[pos] = 10;
                    }
                }
            }
            for (r = 2; r <= 4; r++) {
                for (s = 2; s <= 5; s++) {
                    pos = r * 7 + s;
                    if (this.chipMatrix[pos - 6] == this.player && this.chipMatrix[pos - 12] == this.player && this.chipMatrix[pos + 6] == this.player && this.chipMatrix[pos] == 2 && this.chipMatrix[pos - 7] != 2) {
                        this.priorityMatrix[pos] = 10;
                    }
                }
            }
            i = 1;
            for (n = 1; n <= 6; n++) {
                counter = 0;
                for (j = i; j <= i + 5; j++) {
                    chip = this.chipMatrix[j];
                    if (chip == this.player) {
                        compchip = this.chipMatrix[j + 1];
                        if (compchip == chip) {
                            counter += 1;
                            if (counter == 2) {
                                this.priorityMatrix[j + 2 - 7] = 0;
                            }
                        }
                        else {
                            counter = 0;
                        }
                    }
                }
                i += 7;
            }
            i = 7;
            for (n = 1; n <= 6; n++) {
                counter = 0;
                for (j = i; j >= i - 4; j--) {
                    chip = this.chipMatrix[j];
                    if (chip == this.player) {
                        compchip = this.chipMatrix[j - 1];
                        if (compchip == chip) {
                            counter += 1;
                            if (counter == 2) {
                                this.priorityMatrix[j - 2 - 7] = 0;
                            }
                        }
                        else {
                            counter = 0;
                        }
                    }
                }
                i += 7;
            }
            for (n = 1; n <= 7; n++) {
                counter = 0;
                i = n + 7;
                while (i < n + (4 * 7) + 1) {
                    chip = this.chipMatrix[i - 7];
                    compchip = this.chipMatrix[i];
                    if (chip == this.player && chip == compchip) {
                        counter += 1;
                        if (counter == 2) {
                            if (n > 1) {
                                this.priorityMatrix[i + 7 - 7] = 0;
                            }
                        }
                    }
                    else {
                        counter = 0;
                    }
                    i += 7;
                }
            }
            i = 1;
            while (i <= 15) {
                for (j = i; j <= i + 3; j++) {
                    chip = this.chipMatrix[j];
                    if (chip == this.player) {
                        counter = 0;
                        for (m = 1; m <= 2; m++) {
                            compchip = this.chipMatrix[j + (m * 8)];
                            if (chip == compchip) {
                                counter += 1;
                                if (counter == 2) {
                                    this.priorityMatrix[j + ((m + 1) * 8) - 7] = 0;
                                }
                            }
                            else {
                                counter = 0;
                            }
                        }
                    }
                }
                i += 7;
            }
            i = 22;
            while (i <= 36) {
                for (j = i; j <= i + 3; j++) {
                    chip = this.chipMatrix[j];
                    if (chip == this.player) {
                        counter = 0;
                        for (m = 1; m <= 2; m++) {
                            compchip = this.chipMatrix[j - (m * 6)];
                            if (chip == compchip) {
                                counter += 1;
                                if (counter == 2) {
                                    if (i > 22) {
                                        if (this.chipMatrix[j - (m * 6) - 6 - 7] == 2) {
                                            this.priorityMatrix[j - (m * 6) - 6 - 7] = 0;
                                        }
                                    }
                                }
                            }
                            else {
                                counter = 0;
                            }
                        }
                    }
                }
                i += 7;
            }
            i = 4;
            while (i <= 18) {
                for (j = i; j <= i + 3; j++) {
                    chip = this.chipMatrix[j];
                    if (chip == this.player) {
                        counter = 0;
                        for (m = 1; m <= 2; m++) {
                            compchip = this.chipMatrix[j + (m * 6)];
                            if (chip == compchip) {
                                counter += 1;
                                if (counter == 2) {
                                    this.priorityMatrix[j + ((m + 1) * 6) - 7] = 0;
                                }
                            }
                            else {
                                counter = 0;
                            }
                        }
                    }
                }
                i += 7;
            }
            i = 25;
            while (i <= 39) {
                for (j = i; j <= i + 3; j++) {
                    chip = this.chipMatrix[j];
                    if (chip == this.player) {
                        counter = 0;
                        for (m = 1; m <= 2; m++) {
                            compchip = this.chipMatrix[j - (m * 8)];
                            if (chip == compchip) {
                                counter += 1;
                                if (counter == 2) {
                                    if (i > 25) {
                                        if (this.chipMatrix[j - (m * 8) - 8 - 7] != 2) {
                                            this.priorityMatrix[j - (m * 8) - 8 - 7] = 0;
                                        }
                                    }
                                }
                            }
                            else {
                                counter = 0;
                            }
                        }
                    }
                }
                i += 7;
            }
            for (r = 1; r <= 5; r++) {
                for (s = 3; s <= 6; s++) {
                    pos = r * 7 + s;
                    if (this.chipMatrix[pos - 1] == this.player && this.chipMatrix[pos - 2] == this.player && this.chipMatrix[pos + 1] == this.player) {
                        this.priorityMatrix[pos - 7] = 0;
                    }
                }
            }
            for (r = 1; r <= 5; r++) {
                for (s = 2; s <= 5; s++) {
                    pos = r * 7 + s;
                    if (this.chipMatrix[pos - 1] == this.player && this.chipMatrix[pos + 1] == this.player && this.chipMatrix[pos + 2] == this.player) {
                        this.priorityMatrix[pos - 7] = 0;
                    }
                }
            }
            for (s = 1; s <= 7; s++) {
                for (r = 1; r <= 3; r++) {
                    pos = s + r * 7;
                    if (this.chipMatrix[pos - 7] == this.player && this.chipMatrix[pos + 7] == this.player && this.chipMatrix[pos + 14] == this.player) {
                        this.priorityMatrix[pos - 7] = 0;
                    }
                }
            }
            for (s = 1; s <= 7; s++) {
                for (r = 2; r <= 4; r++) {
                    pos = s + r * 7;
                    if (this.chipMatrix[pos - 7] == this.player && this.chipMatrix[pos - 14] == this.player && this.chipMatrix[pos + 7] == this.player) {
                        this.priorityMatrix[pos - 7] = 0;
                    }
                }
            }
            for (r = 1; r <= 3; r++) {
                for (s = 2; s <= 5; s++) {
                    pos = r * 7 + s;
                    if (this.chipMatrix[pos - 8] == this.player && this.chipMatrix[pos + 8] == this.player && this.chipMatrix[pos + 16] == this.player) {
                        this.priorityMatrix[pos - 7] = 0;
                    }
                }
            }
            for (r = 2; r <= 4; r++) {
                for (s = 3; s <= 6; s++) {
                    pos = r * 7 + s;
                    if (this.chipMatrix[pos - 8] == this.player && this.chipMatrix[pos - 16] == this.player && this.chipMatrix[pos + 8] == this.player) {
                        this.priorityMatrix[pos - 7] = 0;
                    }
                }
            }
            for (r = 1; r <= 3; r++) {
                for (s = 3; s <= 6; s++) {
                    pos = r * 7 + s;
                    if (this.chipMatrix[pos - 6] == this.player && this.chipMatrix[pos + 6] == this.player && this.chipMatrix[pos + 12] == this.player) {
                        this.priorityMatrix[pos - 7] = 0;
                    }
                }
            }
            for (r = 2; r <= 4; r++) {
                for (s = 2; s <= 5; s++) {
                    pos = r * 7 + s;
                    if (this.chipMatrix[pos - 6] == this.player && this.chipMatrix[pos - 12] == this.player && this.chipMatrix[pos + 6] == this.player) {
                        this.priorityMatrix[pos - 7] = 0;
                    }
                }
            }
        }
        this.tempArray = [];
        for (i = 1; i <= 42; i++) {
            if (this.priorityMatrix[i] > 0) {
                this.tempArray.push([i, this.priorityMatrix[i]]);
            }
        }
        if (this.tempArray.length == 0) {
            this.meldungDiv.innerHTML = "<b>The computer gives up - you won!<b>";
            this.winning = true;
            this.buttonDiv.style.display = 'none';
        }
        else {
            this.tempArray.sort((a, b) => b[1] - a[1]);
            i = 1;
            n = 0;
            j = this.tempArray[0][1];
            while (i < this.tempArray.length) {
                if (j == this.tempArray[i][1]) {
                    n = i;
                    j = this.tempArray[i][1];
                }
                else
                    i = this.tempArray.length;
                i++;
            }
            if (n > 0) {
                if (n == 1) {
                    j = Math.abs(this.calcDropcolumn(this.tempArray[0][0]) - 4);
                    m = Math.abs(this.calcDropcolumn(this.tempArray[1][0]) - 4);
                    if (m < j)
                        chipset = this.tempArray[1][0];
                    else
                        chipset = this.tempArray[0][0];
                }
                else {
                    chipset = this.tempArray[n][0];
                }
            }
            else {
                chipset = this.tempArray[0][0];
            }
            var dropColumn = this.calcDropcolumn(chipset);
            this.dropChip(dropColumn);
        }
    }
    update(ctx) {
        this.drawGamescene(ctx);
        this.drawChips(this.ctx);
    }
    setChipParams() {
        for (var i = 0; i < this.chipArray.length; i++) {
            this.chipArray[i].cCenter = this.chipPositions[this.chipArray[i].icMatrix];
            this.chipArray[i].radius = this.chipRadius;
        }
    }
}
class Chip {
    constructor(sCenter, eCenter, radius, colnum, icMatrix) {
        this.sCenter = null;
        this.eCenter = null;
        this.radius = null;
        this.colnum = null;
        this.icMatrix = null;
        this.cCenter = null;
        this.fcolor = '';
        this.scolor = '';
        this.sCenter = sCenter;
        this.eCenter = eCenter;
        this.radius = radius;
        this.colnum = colnum;
        this.icMatrix = icMatrix;
        this.cCenter = sCenter;
        this.fcolor = '';
        this.scolor = '';
    }
    draw(ctx) {
        if (this.colnum == 0) {
            this.fcolor = 'red';
            this.scolor = 'darkred';
        }
        else {
            this.fcolor = 'yellow';
            this.scolor = 'darkyellow';
        }
        var k = new Kreis(this.cCenter, this.radius, 0, 2 * Math.PI, this.fcolor, this.scolor, 1, 'fillstroke');
        k.draw(ctx);
    }
}
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(p) {
        return new Point(this.x + p.x, this.y + p.y);
    }
    subtract(p) {
        return new Point(this.x - p.x, this.y - p.y);
    }
    copy() {
        return this.add(new Point(0, 0));
    }
    distanceTo(p) {
        let dx = p.x - this.x;
        let dy = p.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    projectOntoCircle(point, radius) {
        let angle = this.getAngleBetween(point);
        let newX = point.x + Math.cos(angle) * radius;
        let newY = point.y + Math.sin(angle) * radius;
        return new Point(newX, newY);
    }
    getAngleBetween(point) {
        let delta = this.subtract(point);
        let angle = Math.atan2(delta.y, delta.x);
        return angle;
    }
}
class Kreis {
    constructor(cCenter, r, sAngle, eAngle, fcolor, scolor, lwidth, dflag) {
        this.cCenter = null;
        this.r = 0;
        this.sAngle = 0;
        this.eAngle = 0;
        this.fcolor = '';
        this.scolor = '';
        this.lwidth = 0;
        this.dflag = '';
        this.cCenter = cCenter;
        this.r = r;
        this.sAngle = sAngle;
        this.eAngle = eAngle;
        this.fcolor = fcolor;
        this.scolor = scolor;
        this.lwidth = lwidth;
        this.dflag = dflag;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.cCenter.x, this.cCenter.y, this.r, this.sAngle, this.eAngle);
        switch (this.dflag) {
            case 'fill':
                ctx.fillStyle = this.fcolor;
                ctx.fill();
                break;
            case 'stroke':
                ctx.strokeStyle = this.scolor;
                ctx.lineWidth = this.lwidth;
                ctx.stroke();
                break;
            case 'fillstroke':
                ctx.fillStyle = this.fcolor;
                ctx.fill();
                ctx.strokeStyle = this.scolor;
                ctx.lineWidth = this.lwidth;
                ctx.stroke();
        }
    }
}
