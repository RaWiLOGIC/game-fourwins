/** RaWi-TS-Project: Game FourWins Version 1.0
*   TypeScript-File: fw.ts
*   JavaSript-File:  fw.js
*   CSS-File:        fw.css
*/
/** Global Game-Variable */
var fw:FourWins;
/** Class FourWins */
class FourWins {
  /** Properties */
  // Canvas
  canvasdiv:HTMLElement;
  canvas:any;
  ctx:CanvasRenderingContext2D;
  canvasdimension:number;
  canvasWidth:number;
  canvasHeight:number;
  canvasBackground:string;
  // Div Drop-Buttons
  buttonDiv:HTMLElement;
  // Div report/Meldung
  meldungDiv:HTMLElement;
  // Chips
  chipArray:Array<Chip>;         // Chip-Array
  chipNumber:number;             // Chip-Number
  chipPositions:Array<Point>;    // Array of chip positions in the playing field
  chipRadius:number;             // Chip-Radius
  // Game field circles/Spielfeldkreise
  kreisRadius:number;            // The radius of the playing field circles/Radius der Spielfeld-Kreise
  // Chip-Animation
  losten:number = null;          // Loss of energy on impact/Energieverlust bei Aufprall
  gravity:number = null;         // Gravity/Gravitation
  velY:number = null;            // Y step size for animation/Y-Schrittweite für Animation
  bounceCounter:number = null;   // Impact counterAufprallzähler
  // Drop-Points
  droppointArray:Array<number>;  // Array Drop-Points (X-coordinates of the throw-in points/X-Koordinaten der Einwurf-Points)
  // Game-Vars
  player:number;                 // Variable calcnextMove(), Player
  computer:number;               // Variable calcnextMove(), PC
  proofbr:boolean;               // Flag check bottom row/Prüfung untere Reihe
  curplayer:number;              // Current player/Aktueller Spieler
  winning:boolean;               // Game status flag/Flag für Spielstatus
  numchips:number;               // Variable to recognize game end / tie/Variable zur Erkennung von Spielende / Unentschieden
  chipMatrix:Array<number>;      // Array of chips in the playing field/Array der Chips im Spielfeld
  priorityMatrix:Array<number>;  // Array of priority values/Array der Prioritätswerte
  tempArray:Array<any>;          // Array to determine the highest priority value/zur Ermittlung des höchsten Prioritätswertes
  /** Constructor */
  constructor({
    canvasDiv  = 'canvasdiv',
    canvasTag  = 'canvas',
    buttonDiv  = 'dropbuttons',
    meldungDiv = 'meldungdiv'
  } : {
    canvasDiv?:string;
    canvasTag?:string;
    buttonDiv?:string;
    meldungDiv?:string;
  }
  ) {
    // Plugin-Element
    this.canvasdiv = document.getElementById(canvasDiv);
    // Canvas
    this.canvas = document.getElementsByTagName(canvasTag)[0];
    // RenderingContext
    this.ctx = this.canvas.getContext("2d");
    // Background color Canvas
    this.canvasBackground = '#2472b9';
    // Div Drop-Buttons
    this.buttonDiv = document.getElementById(buttonDiv);
    // Div Report/Meldung
    this.meldungDiv = document.getElementById(meldungDiv);
    // Animations-Vars
    this.losten = 0.45;
    this.gravity = 0.25;
    // EventListener Resize for responsive functionality/EventListener Resize für responsive Funktionalität
    window.addEventListener('resize', this.onWindowResize);
    // Initialize game/Spiel initialisieren
    this.initGame();
  }
  /** Calculate the parameters of the playing field elements/Berechne die Parameter der Spielfeld-Elemente */
  public calcPlayfieldParams():void {
    // Parameter Canvas
    this.canvasWidth = this.canvasdiv.getBoundingClientRect().width;
    this.canvasHeight = this.canvasdiv.getBoundingClientRect().height;
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
    // Border playing field/Spielfeld-Rand
    var border = Math.ceil(this.canvasWidth * 2.8 / 100);
    // Array Chip-Positions und Index
    this.chipPositions = [];
    var chipIndex:number = 42;
    // Draw-Parameter Offset
    var topOffset:number = 55;
    // Calculation of the chip positions on the playing field/Berechnung der Chip-Positionen auf dem Spielfeld
    // -> Array chipPositions
    for (var j = 1; j <= 6; j++) {
      for (var i = 7; i >= 1; i--) {      
        var x = border + (this.canvasWidth / 7 * i - this.canvasWidth / 10);
        var y = topOffset + ((this.canvasHeight - topOffset) / 6 * j - (this.canvasHeight - topOffset) / 10);
        this.chipPositions[chipIndex] = new Point(x,y);
        chipIndex -=1;
      }
    }
    // Playing field circles and chips/Spielfeldkreise und Chips
    this.chipRadius = Math.ceil(this.canvasWidth * 5.6 / 100);;
    this.kreisRadius = this.chipRadius - 1;
    // Calculation of the X drop points/Berechnung der X-Drop-Points -> Array droppointArray
    this.droppointArray = [];
    for (var i = 1; i <= 7; i++) {
      this.droppointArray[i] = border + (this.canvasWidth / 7 * i - this.canvasWidth / 10);
    }    
  }
  /** Initialize game/Spiel initialisieren */
  public initGame(): void {
    this.calcPlayfieldParams();
    this.chipArray = [];
    this.chipMatrix = [];
    for (var i = 1; i <= 42; i++) {
      this.chipMatrix[i] = 2;
    }
    // Vars
    this.chipNumber = 0;
    this.player = 0;
    this.computer = 1;
    this.proofbr = true;
    this.curplayer = 0;
    this.winning = false;
    this.numchips = 42;
    // Draw the playing field/Spielfeld zeichnen
    this.drawGamescene(this.ctx);
    // Show ButtonDiv and message/ButtonDiv und Meldung einblenden
    this.buttonDiv.style.display = 'block';
    this.meldungDiv.innerHTML = 'Insert a chip!';
  }
  /** Chip-Animation */
  private chipAnim(chip:Chip):void {
    // Evaluation of animation and game status/Evaluierung Animations- und Spiel-Status
    if (this.bounceCounter < 4) {
      // Continue the chip animation/Chip-Animation fortsetzen
      requestAnimationFrame(() => this.chipAnim(chip));
    } else {
      // Animation is over -> check game status/Animation ist beendet -> Prüfung Spiel-Status
      // Update chip number/Chip-Nummer aktualisieren
      this.chipNumber +=1;
      // Check game status/Spielstatus prüfen
      var status = this.proof();
      if (status === true && this.winning === false) {
        // Game is not over yet -> switch to another player/Spiel ist noch nicht beendet -> auf anderen Spieler umschalten
        if (this.curplayer == 0) {
          // Computer is the player/Computer ist der Spieler
          this.curplayer = 1;
          this.buttonDiv.style.display = 'none';
          this.calcnextMove();
        } else {
          // Human is the player/Mensch ist der Spieler
          this.curplayer = 0;
          this.buttonDiv.style.display = 'block';
          // Report/Meldung
          this.meldungDiv.innerHTML = "It's your turn.";
        }
      } else {
        // Game is over -> hide ButtonDiv/Das Spiel ist beendet -> ButtonDiv ausblenden
        this.buttonDiv.style.display = 'none';
      }
    }
    // Chip-Animation
    // Impact below/Aufprall unten
    if (chip.cCenter.y >= chip.eCenter.y - 2) {
      this.velY *= -this.losten;
      chip.cCenter.y = chip.eCenter.y;
      this.bounceCounter += 1;
    }
    // Reversal point above/Umkehrpos oben
    if (chip.cCenter.y <= 0) {
      this.velY *= -this.losten;
      chip.cCenter.y = chip.radius;
    }
    // Stop infinite animation/Unendlich währende Animation unterbinden
    if (this.velY < 0.01 && this.velY > -0.01) {
      this.velY = 0
    }
    // Add gravitation/Gravitation addieren
    this.velY += this.gravity;
    // Y-Position Chip
    chip.cCenter.y += this.velY;
    // Update Canvas
    this.update(this.ctx);
  }
  /** Insert chip/Chip einwerfen */
  public dropChip(dropIndex:number):void {
    // Find end point (end coordinates of animation)/End-Point suchen (End-Koordinaten der Animation)
    var endposIndex = this.searchFreeposition(dropIndex);
    // endposIndex greater than zero -> insert chip/endposIndex größer Null -> Chip einwerfen
    if (endposIndex > 0) {
      // Hide ButtonDiv and message/ButtonDiv und Meldung ausblenden
      this.buttonDiv.style.display = 'none';
      this.meldungDiv.innerHTML = '';
      // Drop-Point
      var startCenter:Point = new Point(this.droppointArray[dropIndex],28);
      var endCenter:Point = this.chipPositions[endposIndex];
      // Player (colorNumber)
      var colorNumber:number = this.curplayer;
      // Update the number of chips/Anzahl der Chips aktualisieren
      this.numchips -=1;
      // Update chipMatrix
      this.chipMatrix[endposIndex] = this.curplayer;
      // Create Chip/Chip erstellen
      var chip = new Chip(startCenter, endCenter, this.chipRadius, colorNumber, endposIndex);
      // Chip -> Chip-Array
      this.chipArray[this.chipNumber] = chip;
      // Anim-Vars
      this.velY = 0.25;
      this.bounceCounter = 0;
      // Animation
      this.chipAnim(this.chipArray[this.chipNumber]);
    }
  }
  /** Draw the playing field/Zeichnen des Spielfelds */
  private drawGamescene(ctx:CanvasRenderingContext2D):void {
    // Background Canvas
    ctx.fillStyle = this.canvasBackground;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    // Playing field/Spielfeld
    this.chipPositions.forEach(element => {
      var center:Point = element;
      var c = new Kreis(center, this.kreisRadius, 0, 2 * Math.PI, '#f0f0f0', '', 1, 'fill');
      c.draw(ctx);
    });
  }
  /** Draw the chips/Zeichnen der Chips */
  private drawChips(ctx:CanvasRenderingContext2D):void {
    this.chipArray.forEach(element => {
      element.draw(ctx);
    });
  }
  /** Search for a free field in the column (if no field is free -> return zero) /
      Freies Feld in der Spalte suchen (wenn kein Feld frei -> Null zurückgeben) */
  private searchFreeposition(dropIndex:number):number {
    for (var i = dropIndex; i <= 42; i+=7) {
      if (this.chipMatrix[i] == 2) return i;
    }
    return 0;
  }
  /** Check whether a player has won or the game is a tie /
      Prüfen ob ein Spieler winning hat oder das Spiel unentschieden ist */
  private proof():boolean {
    var counter, i, j, n, m, chip, compchip;
    // horizontal
    i = 1;
    for (n = 1; n <= 6; n++) {
      counter = 0;
      for (j = i+1; j <= i+6; j++) {
        chip = this.chipMatrix[j-1];
        compchip = this.chipMatrix[j];
        if ((chip != 2) && (chip == compchip)) {
          counter +=1;
          if (counter == 3) {
            this.winning = true;
            if (chip == 0) {
              this.meldungDiv.innerHTML = "<b>You won!</b>";
            } else {
              this.meldungDiv.innerHTML = "<b>The computer won!</b>";
            }
            return false;
          }
        } else {
          counter = 0;
        }
      }
      i +=7;
    }
    // vertikal
    for (n = 1; n <= 7; n++) {
      counter = 0;
      i = n + 7;
      while (i<n+(5*7)+1) {
        chip = this.chipMatrix[i-7];
        compchip = this.chipMatrix[i];
        if ((chip != 2) && (chip == compchip)) {
          counter +=1;
          if (counter == 3) {
            this.winning = true;
            if (chip == 0) {
              this.meldungDiv.innerHTML = "<b>You won!</b>";
            } else {
              this.meldungDiv.innerHTML = "<b>The computer won!</b>";
            }
            return false;
          }
        } else {
          counter = 0;
        }
        i +=7;
      }
    }
    // diagonal (left to right/von links nach rechts)
    i = 1;
    while (i <= 15) {
      for (j = i; j <= i+3; j++) {
        chip = this.chipMatrix[j];
        if (chip != 2) {
          counter = 0;
          for (m = 1; m <= 3; m++) {
            compchip = this.chipMatrix[j+(m*8)];
            if (chip == compchip) {
              counter +=1;
              if (counter == 3) {
                this.winning = true;
                if (chip == 0) {
                  this.meldungDiv.innerHTML = "<b>You won!</b>";
                } else {
                  this.meldungDiv.innerHTML = "<b>The computer won!</b>";
                }
                return false;
              }
            } else {
              counter = 0;
            }
          }
        }
      }
      i +=7;
    }
    // diagonal (right to left/von rechts nach links)
    i = 4;
    while (i <= 18) {
      for (j = i; j <= i+3; j++) {
        chip = this.chipMatrix[j];
        if (chip != 2) {
          counter = 0;
          for (m = 1; m <= 3; m++) {
            compchip = this.chipMatrix[j+(m*6)];
            if (chip == compchip) {
              counter +=1;
              if (counter == 3) {
                this.winning = true;
                if (chip == 0) {
                  this.meldungDiv.innerHTML = "<b>You won!</b>";
                } else {
                  this.meldungDiv.innerHTML = "<b>The computer won!</b>";
                }
                return false;
              }
            } else {
              counter = 0;
            }
          }
        }
      }
      i +=7;
    }
    // Game-Status
    // Check for a tie/Prüfung auf unentschieden
    if ((this.numchips == 0) && (this.winning === false)) {
      this.meldungDiv.innerHTML = "<b>The game is a tie!</b>";
      return false;
    }
    // Winning status (true -> end of game)/Gewinnstatus (true -> Spielende)
    if (this.winning === true) {
      return false;
    }
    // Game continues/Spiel geht weiter
    return true;
  }
  /** Calculate the throw-in row/Einwurf-Reihe berechnen */
  private calcDropcolumn(chippos:number):number {
    if (chippos > 7) {
      var i = Math.floor(chippos / 7);
      var dropRow = chippos - (i * 7);
      if (dropRow == 0) dropRow = 7;
    } else dropRow = chippos;
    return dropRow;
  }
  /** Computer: Calculate next move/Kalkuliere den nächsten Zug */
  private calcnextMove():void {
    var counter, i, j, n, m, r, s, chip, compchip, chipset, pos, winflag;
    // Initialize the priority matrix/Prioritäts-Matrix initialisieren
    this.priorityMatrix = [];
    for (i = 1; i <= 42; i++) {
      // Write zero in every field (zero: not assignable, positive values: assignable)
      // Null in jedes Feld schreiben(Null: nicht belegbar, positive Werte: belegbar)
      this.priorityMatrix[i] = 0;
    }
    // Bottom row/untere Reihe
    // Determine assignable fields from chipMatrix and write in priorityMatrix (zero: not assignable, 1: assignable)
    // Belegbare Felder aus chipMatrix ermitteln und in priorityMatrix schreiben (Null: nicht belegbar, 1: belegbar)
    for (i=1; i<=7; i++) {
      if (this.chipMatrix[i] == 2) this.priorityMatrix[i] = 1;
    }
    // Set the winning flag to false/Gewinn-Flag auf false setzen
    winflag = false;
    // Check win/Gewinn-Prüfung
    // Look for own rows of 3 to complete them -> win priority 12
    // Nach eigenen 3er-Reihen suchen, um diese zu ergänzen -> Gewinn-Priorität 12
    // Search horizontally (forward)/Horizontal suchen (vorwärts)
    i = 1;
    for (n=1; n<=6; n++) {
      counter = 0;
      for (j=i; j<=i+4; j++) {
        chip = this.chipMatrix[j];
        if (chip == this.computer) {
          compchip = this.chipMatrix[j+1];
          if (compchip == chip) {
            counter +=1;
            if (counter == 2 && this.chipMatrix[j+2] == 2) {
              if (n > 1) {
                // Check in the upper rows whether there is any chip underneath
                // In oberen Reihen prüfen, ob Chip darunter vorhanden 
                if (this.chipMatrix[j+2-7] != 2) {
                  this.priorityMatrix[j+2] = 12;
                  winflag = true;
                }
              } else {
                this.priorityMatrix[j+2] = 12;
                winflag = true;
              }
            }
          } else {
            counter = 0;
          }
        }
      }
      i +=7;
    }
    // Search horizontally (backwards)/Horizontal suchen (rückwärts)
    i = 7;
    for (n=1; n<=6; n++) {
      counter = 0;
      for (j=i; j>=i-4; j--) {
        chip = this.chipMatrix[j];
        if (chip == this.computer) {
          compchip = this.chipMatrix[j-1];
          if (compchip == chip) {
            counter +=1;
            if (counter == 2 && this.chipMatrix[j-2] == 2) {
              if (n > 1) {
                // Check in the upper rows whether there is any chip underneath
                // In oberen Reihen prüfen, ob Chip darunter vorhanden
                if (this.chipMatrix[j-2-7] != 2) {
                  this.priorityMatrix[j-2] = 12;
                  winflag = true;
                }
              } else {
                this.priorityMatrix[j-2] = 12;
                winflag = true;
              }
            }
          } else {
            counter = 0;
          }
        }
      }
      i +=7;
    }
    // Search vertically/Vertikal suchen
    for (n=1; n<=7; n++) {
      counter = 0;
      i = n+7;
      while (i <= n+(4*7)+1) {
        chip = this.chipMatrix[i-7];
        compchip = this.chipMatrix[i];
        if (chip == this.computer && chip == compchip) {
          counter +=1;
          if (counter == 2 && this.chipMatrix[i+7] == 2) {
            this.priorityMatrix[i+7] = 12;
            winflag = true;
          }
        } else {
          counter = 0;
        }
        i +=7;
      }
    }
    // Search diagonally (left to right and bottom to top)
    // Diagonal suchen (von links nach rechts und von unten nach oben)
    i = 1;
    while (i <= 15) {
      for (j=i; j<=i+3; j++) {
        chip = this.chipMatrix[j];
        if (chip == this.computer) {
          counter = 0;
          for (m=1; m<=2; m++) {
            compchip = this.chipMatrix[j+(m*8)];
            if (chip == compchip) {
              counter +=1;
              if (counter == 2 && this.chipMatrix[j+(m*8)+8-7] != 2 && this.chipMatrix[j+((m+1)*8)] == 2) {
                this.priorityMatrix[j+((m+1)*8)] = 12;
                winflag = true;
              }
            } else {
              counter = 0;
            }
          }
        }
      }
      i +=7;
    }
    // Search diagonally (left to right and top to bottom)
    // Diagonal suchen (von links nach rechts und von oben nach unten)
    i = 22;
    while (i <= 36) {
      for (j=i; j<=i+3; j++) {
        chip = this.chipMatrix[j];
        if (chip == this.computer) {
          counter = 0;
          for (m=1; m<=2; m++) {
            compchip = this.chipMatrix[j-(m*6)];
            if (chip == compchip) {
              counter +=1;
              if (counter == 2 && this.chipMatrix[j-(m*6)-6] == 2) {
                if (i > 22) {
                  if (this.chipMatrix[j-(m*6)-6-7] != 2) {
                    this.priorityMatrix[j-(m*6)-6] = 12;
                    winflag = true;
                  }
                } else {
                  this.priorityMatrix[j-(m*6)-6] = 12;
                  winflag = true;
                }
              }
            } else {
              counter = 0;
            }
          }
        }
      }
      i +=7;
    }
    // Search diagonally (right to left and bottom to top)
    // Diagonal suchen (von rechts nach links und von unten nach oben)
    i = 4;
    while (i <= 18) {
      for (j=i; j<=i+3; j++) {
        chip = this.chipMatrix[j];
        if (chip == this.computer) {
          counter = 0;
          for (m=1; m<=2; m++) {
            compchip = this.chipMatrix[j+(m*6)];
            if (chip == compchip) {
              counter +=1;
              if (counter == 2 && this.chipMatrix[j+(m*6)+6-7] != 2 && this.chipMatrix[j+((m+1)*6)] == 2) {
                this.priorityMatrix[j+((m+1)*6)] = 12;
                winflag = true;
              }
            } else {
              counter = 0;
            }
          }
        }
      }
      i +=7;
    }
    // Search diagonally (right to left and top to bottom)
    // Diagonal suchen (von rechts nach links und von oben nach unten)
    i = 25;
    while (i <= 39) {
      for (j=i; j<=i+3; j++) {
        chip = this.chipMatrix[j];
        if (chip == this.computer) {
          counter = 0;
          for (m=1; m<=2; m++) {
            compchip = this.chipMatrix[j-(m*8)];
            if (chip == compchip) {
              counter +=1;
              if (counter == 2 && this.chipMatrix[j-(m*8)-8] == 2) {
                if (i > 25) {
                  if (this.chipMatrix[j-(m*8)-8-7] != 2) {
                    this.priorityMatrix[j-(m*8)-8] = 12;
                    winflag = true;
                  }
                } else {
                  this.priorityMatrix[j-(m*8)-8] = 12;
                  winflag = true;
                }
              }
            } else {
              counter = 0;
            }
          }
        }
      }
      i +=7;
    }
    // Search fields in broken rows of 3
    // Felder in unterbrochenen 3er-Reihen suchen
    // horizontal H1
    for (r=0; r<=5; r++) {
      for (s=3; s<=6; s++) {
        pos = r*7+s;
        if (this.chipMatrix[pos-1] == this.computer && this.chipMatrix[pos-2] == this.computer && this.chipMatrix[pos+1] == this.computer && this.chipMatrix[pos] == 2) {
          if (r > 0) {
            if (this.chipMatrix[pos-7] != 2) {
              this.priorityMatrix[pos] = 12;
              winflag = true;
            }
          } else {
            this.priorityMatrix[pos] = 12;
            winflag = true;
          }
        }
      }
    }
    // horizontal H2
    for (r=0; r<=5; r++) {
      for (s=2; s<=5; s++) {
        pos = r*7+s;
        if (this.chipMatrix[pos-1] == this.computer && this.chipMatrix[pos+1] == this.computer && this.chipMatrix[pos+2] == this.computer && this.chipMatrix[pos] == 2) {
          if (r > 0) {
            if (this.chipMatrix[pos-7] != 2) {
              this.priorityMatrix[pos] = 12;
              winflag = true;
            }
          } else {
            this.priorityMatrix[pos] = 12;
            winflag = true;
          }
        }
      }
    }
    // vertikal V1
    for (s=1; s<=7; s++) {
      for (r=1; r<=3; r++) {
        pos = s+r*7;
        if (this.chipMatrix[pos-7] == this.computer && this.chipMatrix[pos+7] == this.computer && this.chipMatrix[pos+14] == this.computer && this.chipMatrix[pos] == 2 && this.chipMatrix[pos-7] != 2) {
          this.priorityMatrix[pos] = 12;
          winflag = true;
        }
      }
    }
    // vertikal V2
    for (s=1; s<=7; s++) {
      for (r=2; r<=4; r++) {
        pos = s+r*7;
        if (this.chipMatrix[pos-7] == this.computer && this.chipMatrix[pos-14] == this.computer && this.chipMatrix[pos+7] == this.computer && this.chipMatrix[pos] == 2 && this.chipMatrix[pos-7] != 2) {
          this.priorityMatrix[pos] = 12;
          winflag = true;
        }
      }
    }
    // diagonale D1
    for (r=1; r<=3; r++) {
      for (s=2; s<=5; s++) {
        pos = r*7+s;
        if (this.chipMatrix[pos-8] == this.computer && this.chipMatrix[pos+8] == this.computer && this.chipMatrix[pos+16] == this.computer && this.chipMatrix[pos] == 2 && this.chipMatrix[pos-7] != 2) {
          this.priorityMatrix[pos] = 12;
          winflag = true;
        }
      }
    }
    // diagonal D2
    for (r=2; r<=4; r++) {
      for (s=3; s<=6; s++) {
        pos = r*7+s;
        if (this.chipMatrix[pos-8] == this.computer && this.chipMatrix[pos-16] == this.computer && this.chipMatrix[pos+8] == this.computer && this.chipMatrix[pos] == 2 && this.chipMatrix[pos-7] != 2) {
          this.priorityMatrix[pos] = 12;
          winflag = true;
        }
      }
    }
    // diagonal D3
    for (r=1; r<=3; r++) {
      for (s=3; s<=6; s++) {
        pos = r*7+s;
        if (this.chipMatrix[pos-6] == this.computer && this.chipMatrix[pos+6] == this.computer && this.chipMatrix[pos+12] == this.computer && this.chipMatrix[pos] == 2 && this.chipMatrix[pos-7] != 2) {
          this.priorityMatrix[pos] = 12;
          winflag = true;
        }
      }
    }
    // diagonal D4
    for (r=2; r<=4; r++) {
      for (s=2; s<=5; s++) {
        pos = r*7+s;
        if (this.chipMatrix[pos-6] == this.computer && this.chipMatrix[pos-12] == this.computer && this.chipMatrix[pos+6] == this.computer && this.chipMatrix[pos] == 2 && this.chipMatrix[pos-7] != 2) {
          this.priorityMatrix[pos] = 12;
          winflag = true;
        }
      }
    }
    // General exams/Generelle Prüfungen
    if (winflag === false) {
      // Bottom row/Untere Reihe
      // Cover middle field 4 -> priority 9/Mittleres Feld 4 belegen -> Priorität 9
      if (this.proofbr === true) {
        if (this.chipMatrix[4] == 2) {
          this.priorityMatrix[4] = 9;
        }
      }
      // The human opponent must not have two stones with a free space in the middle -> priority 10
      // Der menschliche Gegner darf keine zwei chipe mit einem freien Feld in der Mitte haben -> Priorität 10
      if (this.proofbr === true) {
        m = 0;
        for (i=1; i<=5; i++) {
          if (this.chipMatrix[i] == this.player && this.chipMatrix[i + 2] == this.player && this.chipMatrix[i + 1] == 2) {
            // Only put the chip in the bottom row if the surrounding fields are free
            // Chip nur in untere Reihe setzen wenn umliegende Felder frei sind
            if (i >= 1 && i <= 4 && this.chipMatrix[i-1] == 2 && this.chipMatrix[i+3] == 2) m = i + 1;
          }
        }
        if (m > 0) {
          this.priorityMatrix[m] = 10;
        }
      }
      // The human opponent must not have more than 2 free stones -> priority 10
      // Der menschliche Gegner darf nicht mehr als 2 freie chipe haben -> Priorität 10
      if (this.proofbr === true) {
        for (i=2; i<=5; i++) {
          if (this.chipMatrix[i] == this.player && this.chipMatrix[i+1] == this.player && this.chipMatrix[i+2] == 2 && this.chipMatrix[i-1] == 2) {
            if (Math.round(Math.random()) == 0) {
              m = i - 1;
            } else {
              m = i + 2;
            }
            this.priorityMatrix[m] = 10;
          }
        }
      }
      // If the bottom row is occupied, the above tests are no longer required
      // Wenn untere Reihe belegt ist werden die oben stehenden Prüfungen nicht mehr benötigt
      if (this.proofbr === true) {
        j = true;
        for (i=1; i<=7; i++) {
          if (this.chipMatrix[i] == 2) {
            j = false;
          }
        }
        if (j === true) {
          this.proofbr = false;
        }
      }
      // Search for assignable fields in the top rows -> Priority 1
      // Belegbare Felder in den oberen Reihen suchen -> Priorität 1
      n = 8;
      while (n <= 36) {
        for (i=n; i<=n+6; i++) {
          if (this.chipMatrix[i] == 2 && this.chipMatrix[i-7] != 2) {
            this.priorityMatrix[i] = 1;
          }
        }
        n +=7;
      }
      // Search for fields in the middle (2 - 6) -> priority 1
      // Nach Feldern in der Mitte (2 - 6) suchen -> Priorität 1
      for (n=2; n<=6; n++) {
        i = n + 7;
        while (i < n+(4*7)+1) {
          chip = this.chipMatrix[i-7];
          compchip = this.chipMatrix[i];
          if (chip == this.player && compchip == 2) {
            this.priorityMatrix[i] = 1;
          }
          i +=7;
        }
      }
      // Look for your own chips in the upper rows and form a row of two -> priority 2
      // Nach nach eigenen Chips in oberen Reihen suchen und Zweier-Reihe bilden -> Priorität 2
      i = 8;
      for (n=1; n<=7; n++) {
        while (i <= 36) {
          if (this.chipMatrix[i] == this.computer && this.chipMatrix[i+1] == 2 && this.chipMatrix[i+1-7] != 2) {
            this.priorityMatrix[i+1] = 2;
          }
          i +=7;
        }
      }
      // Look for your own rows of 2 to complete them -> priority 3
      // Nach eigenen 2er-Reihen suchen, um diese zu ergänzen -> Priorität 3
      // Search horizontally (forward)/Horizontal suchen (vorwärts)
      i = 1;
      for (n=1; n<=6; n++) {
        for (j=i; j<=i+4; j++) {
          chip = this.chipMatrix[j];
          if (chip == this.computer) {
            compchip = this.chipMatrix[j+1];
            if (compchip == chip) {
              if (this.chipMatrix[j+2] == 2) {
                if (n > 1) {
                  // Check in the upper rows whether there are chips underneath
                  // In oberen Reihen prüfen, ob Chip darunter vorhanden
                  if (this.chipMatrix[j+2-7] != 2) {
                    this.priorityMatrix[j+2] = 3;
                  }
                } else {
                  this.priorityMatrix[j+2] = 3;
                }
              }
            }
          }
        }
        i +=7;
      }
      // Search horizontally (backwards)
      // Horizontal suchen (rückwärts)
      i = 7;
      for (n=1; n<=6; n++) {
        for (j=i; j>=i-4; j--) {
          chip = this.chipMatrix[j];
          if (chip == this.computer) {
            compchip = this.chipMatrix[j-1];
            if (compchip == chip) {
              if (this.chipMatrix[j-2] == 2) {
                if (n > 1) {
                  // Check in the upper rows whether there are chips underneath
                  // In oberen Reihen prüfen, ob Chip darunter vorhanden
                  if (this.chipMatrix[j-2-7] != 2) {
                    this.priorityMatrix[j-2] = 3;
                  }
                } else {
                  this.priorityMatrix[j-2] = 3;
                }
              }
            }
          }
        }
        i +=7;
      }
      // Search vertically/Vertikal suchen
      for (n=1; n<=7; n++) {
        i = n + 7;
        while (i < n+(4*7)+1) {
          chip = this.chipMatrix[i-7];
          compchip = this.chipMatrix[i];
          if (chip == this.computer && chip == compchip) {
            if (this.chipMatrix[i+7] == 2) {
              if (n > 1) {
                  // Check in the upper rows whether there are chips underneath
                  // In oberen Reihen prüfen, ob Chip darunter vorhanden
                  if (this.chipMatrix[i] != 2) {
                  this.priorityMatrix[i+7] = 3;
                }
              } else {
                this.priorityMatrix[i+7] = 3;
              }
            }
          }
          i +=7;
        }
      }
      // Search diagonally (left to right and bottom to top)
      // Diagonal suchen (von links nach rechts und von unten nach oben)
      i = 1;
      while (i <= 15) {
        for (j=i; j<=i+3; j++) {
          chip = this.chipMatrix[j];
          if (chip == this.computer) {
            compchip = this.chipMatrix[j+8];
            if (chip == compchip) {
              if (this.chipMatrix[j+16-7] != 2 && this.chipMatrix[j+16] == 2) {
                this.priorityMatrix[j+16] = 3;
              }
            }
          }
        }
        i +=7;
      }
      // Search diagonally (left to right and top to bottom)
      // Diagonal suchen (von links nach rechts und von oben nach unten)
      i = 22;
      while (i <= 36) {
        for (j=i; j<=i+3; j++) {
          chip = this.chipMatrix[j];
          if (chip == this.computer) {
            compchip = this.chipMatrix[j-6];
            if (chip == compchip) {
              if (this.chipMatrix[j-12] == 2 && this.chipMatrix[j-12-7] != 2) {
                this.priorityMatrix[j-12] = 3;
              }
            }
          }
        }
        i +=7;
      }
      // Search diagonally (right to left and bottom to top)
      // Diagonal suchen (von rechts nach links und von unten nach oben)
      i = 4;
      while (i <= 18) {
        for (j=i; j<=i+3; j++) {
          chip = this.chipMatrix[j];
          if (chip == this.computer) {
            compchip = this.chipMatrix[j+6];
            if (chip == compchip) {
              if (this.chipMatrix[j+12-7] != 2 && this.chipMatrix[j+12] == 2) {
                this.priorityMatrix[j+12] = 3;
              }
            }
          }
        }
        i +=7;
      }
      // Search diagonally (right to left and top to bottom)
      // Diagonal suchen (von rechts nach links und von oben nach unten)
      i = 25;
      while (i <= 39) {
        for (j=i; j<=i+3; j++) {
          chip = this.chipMatrix[j];
          if (chip == this.computer) {
            compchip = this.chipMatrix[j-8];
            if (chip == compchip) {
              if (this.chipMatrix[j-16] == 2 && this.chipMatrix[j-16-7] != 2) {
                this.priorityMatrix[j-16] = 3;
              }
            }
          }
        }
        i +=7;
      }
      // Search for middle field 4 -> priority 4/Nach mittlerem Feld 4 suchen -> Priorität 4
      n = 4;
      i = n + 7;
      while (i < n+(4*7)+1) {
        if (this.chipMatrix[i-7] == this.player && this.chipMatrix[i] == 2) {
          this.priorityMatrix[i] = 4;
        }
        i +=7;
      }
      // Look for two player chips with a free space in the middle -> priority 5
      // Nach zwei Playerchips mit freiem Feld in der Mitte suchen -> Priorität 5
      // horizontal
      i = 1;
      while (i <= 36) {
        for (j=i; j<=i+5; j++) {
          chip = this.chipMatrix[j];
          if (chip == this.player) {
            compchip = this.chipMatrix[j+2];
            if (chip == compchip) {
              if (this.chipMatrix[j+1] == 2) {
                if (i > 1) {
                  // Check in the upper rows whether there are chips underneath
                  // In oberen Reihen prüfen, ob Chips darunter vorhanden
                  if (this.chipMatrix[j+1-7] != 2) {
                    this.priorityMatrix[j+1] = 5;
                  }
                } else {
                  // Only put the chip in the bottom row if the field after next is also occupied by the human opponent
                  // Chip nur in untere Reihe setzen wenn übernächstes Feld auch vom menschlichen Gegner besetzt ist
                  if (j <= i+4 && this.chipMatrix[j+3] == this.player) this.priorityMatrix[j+1] = 5;
                }
              }
            }
          }
        }
        i +=7;
      }
      // Search diagonally (from top left to right)
      // Diagonal suchen (von links nach rechts oben)
      i = 1;
      while (i <= 22) {
        for (j=i; j<=i+4; j++) {
          chip = this.chipMatrix[j];
          if (chip == this.player) {
            compchip = this.chipMatrix[j+16];
            if (chip == compchip) {
              if (this.chipMatrix[j+1] != 2 && this.chipMatrix[j+8] == 2) {
                this.priorityMatrix[j+8] = 5;
              }
            }
          }
        }
        i +=7;
      }
      // Search diagonally (from right to left above)
      // Diagonal suchen (von rechts nach links oben)
      i = 3;
      while (i <= 24) {
        for (j=i; j<=i+4; j++) {
          chip = this.chipMatrix[j];
          if (chip == this.player) {
            compchip = this.chipMatrix[j+12];
            if (chip == compchip) {
              if (this.chipMatrix[j-1] != 2 && this.chipMatrix[j+6] == 2) {
                this.priorityMatrix[j+6] = 5;
              }
            }
          }
        }
        i +=7;
      }
      // Look for opposing rows of 2 to place a chip next to it -> priority 6
      // Nach gegnerischen 2er-Reihen suchen, um Chip daneben zu setzen -> Priorität 6
      // Search horizontally (forward)/Horizontal suchen (vorwärts)
      i = 1;
      for (n=1; n<=6; n++) {
        for (j=i; j<=i+4; j++) {
          chip = this.chipMatrix[j];
          if (chip == this.player) {
            compchip = this.chipMatrix[j+1];
            if (compchip == chip) {
              if (this.chipMatrix[j+2] == 2) {
                if (i > 1) {
                  // Check in the upper rows whether there are chips underneath
                  // In oberen Reihen prüfen, ob Chip darunter vorhanden 
                  if (this.chipMatrix[j+2-7] != 2) {
                    this.priorityMatrix[j+2] = 6;
                  }
                } else {
                  this.priorityMatrix[j+2] = 6;
                }
              }
            }
          }
        }
        i +=7;
      }
      // Search horizontally (backwards)/Horizontal suchen (rückwärts)
      i = 7;
      for (n=1; n<=6; n++) {
        for (j=i; j>=i-4; j--) {
          chip = this.chipMatrix[j];
          if (chip == this.player) {
            compchip = this.chipMatrix[j-1];
            if (compchip == chip) {
              if (this.chipMatrix[j-2] == 2) {
                if (i > 7) {
                  // Check in the upper rows whether there are chips underneath
                  // In oberen Reihen prüfen, ob Chip darunter vorhanden 
                  if (this.chipMatrix[j-2-7] != 2) {
                    this.priorityMatrix[j-2] = 6;
                  }
                } else {
                  this.priorityMatrix[j-2] = 6;
                }
              }
            }
          }
        }
        i +=7;
      }
      // Vertikal
      for (n=1; n<=7; n++) {
        i = n+7;
        while (i < n+(4*7)+1) {
          chip = this.chipMatrix[i-7];
          compchip = this.chipMatrix[i];
          if (chip == this.player && chip == compchip) {
            if (this.chipMatrix[i+7] == 2) {
              if (n > 1) {
                  // Check in the upper rows whether there are chips underneath
                  // In oberen Reihen prüfen, ob Chip darunter vorhanden 
                  if (this.chipMatrix[i] != 2) {
                  this.priorityMatrix[i+7] = 6;
                }
              } else {
                this.priorityMatrix[i+7] = 6;
              }
            }
          }
          i +=7;
        }
      }
      // Search diagonally (left to right and bottom to top)
      // Diagonal suchen (von links nach rechts und von unten nach oben)
      i = 1;
      while (i <= 15) {
        for (j=i; j<=i+3; j++) {
          chip = this.chipMatrix[j];
          if (chip == this.player) {
            compchip = this.chipMatrix[j+8];
            if (chip == compchip) {
              if (this.chipMatrix[j+16-7] != 2 && this.chipMatrix[j+16] == 2) {
                this.priorityMatrix[j+16] = 6;
              }
            }
          }
        }
        i +=7;
      }
      // Search diagonally (left to right and top to bottom)
      // Diagonal suchen (von links nach rechts und von oben nach unten)
      i = 22;
      while (i <= 36) {
        for (j=i; j<=i+3; j++) {
          chip = this.chipMatrix[j];
          if (chip == this.player) {
            compchip = this.chipMatrix[j-6];
            if (chip == compchip) {
              if (this.chipMatrix[j-12] == 2 && this.chipMatrix[j-12-7] != 2) {
                this.priorityMatrix[j-12] = 6;
              }
            }
          }
        }
        i +=7;
      }
      // Search diagonally (right to left and bottom to top)
      // Diagonal suchen (von rechts nach links und von unten nach oben)
      i = 4;
      while (i <= 18) {
        for (j=i; j<=i+3; j++) {
          chip = this.chipMatrix[j];
          if (chip == this.player) {
            compchip = this.chipMatrix[j+6];
            if (chip == compchip) {
              if (this.chipMatrix[j+12-7] != 2 && this.chipMatrix[j+12] == 2) {
                this.priorityMatrix[j+12] = 6;
              }
            }
          }
        }
        i +=7;
      }
      // Search diagonally (right to left and top to bottom)
      // Diagonal suchen (von rechts nach links und von oben nach unten)
      i = 25;
      while (i <= 39) {
        for (j=i; j<=i+3; j++) {
          chip = this.chipMatrix[j];
          if (chip == this.player) {
            compchip = this.chipMatrix[j-8];
            if (chip == compchip) {
              if (this.chipMatrix[j-16] == 2 && this.chipMatrix[j-16-7] != 2) {
                this.priorityMatrix[j-16] = 6;
              }
            }
          }
        }
        i +=7;
      }
      // Look for two diagonal playerchpis and place the fourth stone in the row -> priority 7
      // Zwei diagonale Playerchpis suchen und in der Reihe liegenden vierten chip setzen -> Priorität 7
      // Search diagonally (from top left to bottom right)
      // Diagonal suchen (von links oben nach rechts unten)
      i = 22;
      while (i <= 36) {
        for (j=i; j<=i+3; j++) {
          chip = this.chipMatrix[j];
          if (chip == this.player) {
            compchip = this.chipMatrix[j-6];
            if (chip == compchip) {
              if (this.chipMatrix[j-12] == 2 && this.chipMatrix[j-18] == 2) {
                if (i > 22) {
                  // Check in the upper rows whether there are chips underneath
                  // In oberen Reihen prüfen, ob Chip darunter vorhanden 
                  if (this.chipMatrix[j-18-7] != 2) {
                    this.priorityMatrix[j-18] = 7;
                  }
                } else {
                  this.priorityMatrix[j-18] = 7;
                }
              }
            }
          }
        }
        i +=7;
      }
      // Search diagonally (from top right to bottom left)
      // Diagonal suchen (von rechts oben nach links unten)
      i = 25;
      while (i <= 42) {
        for (j=i; j<=i+3; j++) {
          chip = this.chipMatrix[j];
          if (chip == this.player) {
            compchip = this.chipMatrix[j-8];
            if (chip == compchip) {
              if (this.chipMatrix[j-16] == 2 && this.chipMatrix[j-24] == 2) {
                if (i > 25) {
                  // Check in the upper rows whether there are chips underneath
                  // In oberen Reihen prüfen, ob Chip darunter vorhanden 
                  if (this.chipMatrix[j-24-7] != 2) {
                    this.priorityMatrix[j-24] = 7;
                  }
                } else {
                  this.priorityMatrix[j-24] = 7;
                }
              }
            }
          }
        }
        i +=7;
      }
      // Look for your own two diagonal chips and place the fourth stone in the row -> priority 8
      // Nach eigenen zwei diagonalen Chips suchen und in der Reihe liegenden vierten chip setzen -> Priorität 8
      // Search diagonally (from left to center and top to bottom)
      // Diagonal suchen (von links bis mitte und von oben nach unten)
      i = 22;
      while (i <= 36) {
        for (j=i; j<=i+4; j++) {
          chip = this.chipMatrix[j];
          if (chip == this.computer) {
            compchip = this.chipMatrix[j-6];
            if (chip == compchip) {
              if (this.chipMatrix[j-12] == 2 && this.chipMatrix[j-18] == 2) {
                if (i > 22) {
                  // Check in the upper rows whether there are chips underneath
                  // In oberen Reihen prüfen, ob Chip darunter vorhanden 
                  if (this.chipMatrix[j-18-7] != 2) {
                    this.priorityMatrix[j-18] = 8;
                  }
                } else {
                  this.priorityMatrix[j-18] = 8;
                }
              }
            }
          }
        }
        i +=7;
      }
      // Search diagonally (from center to right and from top to bottom)
      // Diagonal suchen (von mitte nach rechts und von oben nach unten)
      i = 25;
      while (i <= 42) {
        for (j=i; j<=i+4; j++) {
          chip = this.chipMatrix[j];
          if (chip == this.computer) {
            compchip = this.chipMatrix[j-8];
            if (chip == compchip) {
              if (this.chipMatrix[j-16] == 2 && this.chipMatrix[j-24] == 2) {
                if (i > 25) {
                  // Check in the upper rows whether there are chips underneath
                  // In oberen Reihen prüfen, ob Chip darunter vorhanden 
                  if (this.chipMatrix[j-24-7] != 2) {
                    this.priorityMatrix[j-24] = 8;
                  }
                } else {
                  this.priorityMatrix[j-24] = 8;
                }
              }
            }
          }
        }
        i +=7;
      }
      // Search whether the opponent has 3 chips in a row and could place a fourth chip -> priority 9
      // Suchen, ob der Gegner 3 Chips in einer Reihe hat und vierten Chip setzen könnte -> Priorität 9
      // Search horizontally (forward)/Horizontal suchen (vorwärts)
      i = 1;
      for (n=1; n<=6; n++) {
        counter = 0;
        for (j=i; j<=i+4; j++) {
          chip = this.chipMatrix[j];
          if (chip == this.player) {
            compchip = this.chipMatrix[j+1];
            if (compchip == chip) {
              counter +=1;
              if (counter == 2 && this.chipMatrix[j+2] == 2) {
                if (n > 1) {
                  // Check in the upper rows whether there are chips underneath
                  // In oberen Reihen prüfen, ob Chip darunter vorhanden 
                  if (this.chipMatrix[j+2-7] != 2) {
                    this.priorityMatrix[j+2] = 9;
                  }
                } else {
                  this.priorityMatrix[j+2] = 9;
                }
              }
            } else {
              counter = 0;
            }
          }
        }
        i +=7;
      }
      // Search horizontally (backwards)/Horizontal suchen (rückwärts)
      i = 7;
      for (n=1; n<=6; n++) {
        counter = 0;
        for (j=i; j>=i-4; j--) {
          chip = this.chipMatrix[j];
          if (chip == this.player) {
            compchip = this.chipMatrix[j-1];
            if (compchip == chip) {
              counter +=1;
              if (counter == 2 && this.chipMatrix[j-2] == 2) {
                if (n > 1) {
                  // Check in the upper rows whether there are chips underneath
                  // In oberen Reihen prüfen, ob Chip darunter vorhanden 
                  if (this.chipMatrix[j-2-7] != 2) {
                    this.priorityMatrix[j-2] = 9;
                  }
                } else {
                  this.priorityMatrix[j-2] = 9;
                }
              }
            } else {
              counter = 0;
            }
          }
        }
        i +=7;
      }
      // Search vertically/Vertikal suchen
      for (n=1; n<=7; n++) {
        counter = 0;
        i = n+7;
        while (i < n+(4*7)+1) {
          chip = this.chipMatrix[i-7];
          compchip = this.chipMatrix[i];
          if (chip == this.player && chip == compchip) {
            counter +=1;
            if (counter == 2 && this.chipMatrix[i+7] == 2) {
              if (n > 1) {
                  // Check in the upper rows whether there are chips underneath
                  // In oberen Reihen prüfen, ob Chip darunter vorhanden 
                  if (this.chipMatrix[i] != 2) {
                  this.priorityMatrix[i+7] = 9;
                }
              } else {
                this.priorityMatrix[i+7] = 9;
              }
            }
          } else {
            counter = 0;
          }
          i +=7;
        }
      }
      // Search diagonally (left to right and bottom to top)
      // Diagonal suchen (von links nach rechts und von unten nach oben)
      i = 1;
      while (i <= 15) {
        for (j=i; j<=i+3; j++) {
          chip = this.chipMatrix[j];
          if (chip == this.player) {
            counter = 0;
            for (m=1; m<=2; m++) {
              compchip = this.chipMatrix[j+(m*8)];
              if (chip == compchip) {
                counter +=1;
                if (counter == 2 && this.chipMatrix[j+(m*8)+8-7] != 2 && this.chipMatrix[j+((m+1)*8)] == 2) {
                  this.priorityMatrix[j+((m+1)*8)] = 9;
                }
              } else {
                counter = 0;
              }
            }
          }
        }
        i +=7;
      }
      // Search diagonally (left to right and top to bottom)
      // Diagonal suchen (von links nach rechts und von oben nach unten)
      i = 22;
      while (i <= 36) {
        for (j=i; j<=i+3; j++) {
          chip = this.chipMatrix[j];
          if (chip == this.player) {
            counter = 0;
            for (m=1; m<=2; m++) {
              compchip = this.chipMatrix[j-(m*6)];
              if (chip == compchip) {
                counter +=1;
                if (counter == 2 && this.chipMatrix[j-(m*6)-6] == 2) {
                  if (i > 22) {
                    if (this.chipMatrix[j-(m*6)-6-7] != 2) {
                      this.priorityMatrix[j-(m*6)-6] = 9;
                    }
                  } else {
                    this.priorityMatrix[j-(m*6)-6] = 9;
                  }
                }
              } else {
                counter = 0;
              }
            }
          }
        }
        i +=7;
      }
      // Search diagonally (right to left and bottom to top)
      // Diagonal suchen (von rechts nach links und von unten nach oben)
      i = 4;
      while (i <= 18) {
        for (j=i; j<=i+3; j++) {
          chip = this.chipMatrix[j];
          if (chip == this.player) {
            counter = 0;
            for (m=1; m<=2; m++) {
              compchip = this.chipMatrix[j+(m*6)];
              if (chip == compchip) {
                counter +=1;
                if (counter == 2 && this.chipMatrix[j+(m*6)+6-7] != 2 && this.chipMatrix[j+((m+1)*6)] == 2) {
                  this.priorityMatrix[j+((m+1)*6)] = 9;
                }
              } else {
                counter = 0;
              }
            }
          }
        }
        i +=7;
      }
      // Search diagonally (right to left and top to bottom)
      // Diagonal suchen (von rechts nach links und von oben nach unten)
      i = 25;
      while (i <= 39) {
        for (j=i; j<=i+3; j++) {
          chip = this.chipMatrix[j];
          if (chip == this.player) {
            counter = 0;
            for (m=1; m<=2; m++) {
              compchip = this.chipMatrix[j-(m*8)];
              if (chip == compchip) {
                counter +=1;
                if (counter == 2 && this.chipMatrix[j-(m*8)-8] == 2) {
                  if (i > 25) {
                    if (this.chipMatrix[j-(m*8)-8-7] != 2) {
                      this.priorityMatrix[j-(m*8)-8] = 9;
                    }
                  } else {
                    this.priorityMatrix[j-(m*8)-8] = 9;
                  }
                }
              } else {
                counter = 0;
              }
            }
          }
        }
        i +=7;
      }
      // Look for fields in interrupted rows of 3 of the opponent and prevent these fields from being occupied by him
      // (be sure to fill them yourself!) -> priority 10
      // Felder in unterbrochenen 3er-Reihen des Gegners suchen und verhindern, dass diese Felder von ihm belegt werden
      // (unbedingt selbst besetzen!) -> Priorität 10
      // Horizontal H1  
      for (r=0; r<=5; r++) {
        for (s=3; s<=6; s++) {
          pos = r*7+s;
          if (this.chipMatrix[pos-1] == this.player && this.chipMatrix[pos-2] == this.player && this.chipMatrix[pos+1] == this.player && this.chipMatrix[pos] == 2) {
            if (r > 0) {
              if (this.chipMatrix[pos-7] != 2) {
                this.priorityMatrix[pos] = 10;
              }
            } else {
              this.priorityMatrix[pos] = 10;
            }
          }
        }
      }
      // Horizontal H2
      for (r=0; r<=5; r++) {
        for (s=2; s<=5; s++) {
          pos = r*7+s;
          if (this.chipMatrix[pos-1] == this.player && this.chipMatrix[pos+1] == this.player && this.chipMatrix[pos+2] == this.player && this.chipMatrix[pos] == 2) {
            if (r > 0) {
              if (this.chipMatrix[pos-7] != 2) {
                this.priorityMatrix[pos] = 10;
              }
            } else {
              this.priorityMatrix[pos] = 10;
            }
          }
        }
      }
      // Vertikal V1
      for (s=1; s<=7; s++) {
        for (r=1; r<=3; r++) {
          pos = s+r*7;
          if (this.chipMatrix[pos-7] == this.player && this.chipMatrix[pos+7] == this.player && this.chipMatrix[pos+14] == this.player && this.chipMatrix[pos] == 2 && this.chipMatrix[pos-7] != 2) {
            this.priorityMatrix[pos] = 10;
          }
        }
      }
      // Vertikal V2
      for (s=1; s<=7; s++) {
        for (r=2; r<=4; r++) {
          pos = s+r*7;
          if (this.chipMatrix[pos-7] == this.player && this.chipMatrix[pos-14] == this.player && this.chipMatrix[pos+7] == this.player && this.chipMatrix[pos] == 2 && this.chipMatrix[pos-7] != 2) {
            this.priorityMatrix[pos] = 10;
          }
        }
      }
      // Diagonal D1
      for (r=1; r<=3; r++) {
        for (s=2; s<=5; s++) {
          pos = r*7+s;
          if (this.chipMatrix[pos-8] == this.player && this.chipMatrix[pos+8] == this.player && this.chipMatrix[pos+16] == this.player && this.chipMatrix[pos] == 2 && this.chipMatrix[pos-7] != 2) {
            this.priorityMatrix[pos] = 10;
          }
        }
      }
      // Diagonal D2
      for (r=2; r<=4; r++) {
        for (s=3; s<=6; s++) {
          pos = r*7+s;
          if (this.chipMatrix[pos-8] == this.player && this.chipMatrix[pos-16] == this.player && this.chipMatrix[pos+8] == this.player && this.chipMatrix[pos] == 2 && this.chipMatrix[pos-7] != 2) {
            this.priorityMatrix[pos] = 10;
          }
        }
      }
      // Diagonal D3
      for (r=1; r<=3; r++) {
        for (s=3; s<=6; s++) {
          pos = r*7+s;
          if (this.chipMatrix[pos-6] == this.player && this.chipMatrix[pos+6] == this.player && this.chipMatrix[pos+12] == this.player && this.chipMatrix[pos] == 2 && this.chipMatrix[pos-7] != 2) {
            this.priorityMatrix[pos] = 10;
          }
        }
      }
      // Diagonal D4
      for (r=2; r<=4; r++) {
        for (s=2; s<=5; s++) {
          pos = r*7+s;
          if (this.chipMatrix[pos-6] == this.player && this.chipMatrix[pos-12] == this.player && this.chipMatrix[pos+6] == this.player && this.chipMatrix[pos] == 2 && this.chipMatrix[pos-7] != 2) {
            this.priorityMatrix[pos] = 10;
          }
        }
      }
      // Look for fields that, if occupied, would enable the opponent to form a row of four
      // -> not assignable, priority 0
      // Felder suchen, die, würde man sie belegen, es dem Gegner ermöglichen eine Viererreihe zu bilden
      // -> nicht belegbar, Priorität 0
      // Look for rows of 3 of the opponent/3er-Reihen des Gegners suchen
      // Search horizontally (forward)/Horizontal suchen (vorwärts)
      i = 1;
      for (n=1; n<=6; n++) {
        counter = 0;
        for (j=i; j<=i+5; j++) {
          chip = this.chipMatrix[j];
          if (chip == this.player) {
            compchip = this.chipMatrix[j+1];
            if (compchip == chip) {
              counter +=1;
              if (counter == 2) {
                this.priorityMatrix[j+2-7] = 0;
              }
            } else {
              counter = 0;
            }
          }
        }
        i +=7;
      }
      // Search horizontally (backwards)/Horizontal suchen (rückwärts)
      i = 7;
      for (n=1; n<=6; n++) {
        counter = 0;
        for (j=i; j>=i-4; j--) {
          chip = this.chipMatrix[j];
          if (chip == this.player) {
            compchip = this.chipMatrix[j-1];
            if (compchip == chip) {
              counter +=1;
              if (counter == 2) {
                this.priorityMatrix[j-2-7] = 0;
              }
            } else {
              counter = 0;
            }
          }
        }
        i +=7;
      }
      // Search vertically/Vertikal suchen
      for (n=1; n<=7; n++) {
        counter = 0;
        i = n+7;
        while (i < n+(4*7)+1) {
          chip = this.chipMatrix[i-7];
          compchip = this.chipMatrix[i];
          if (chip == this.player && chip == compchip) {
            counter +=1;
            if (counter == 2) {
              if (n>1) {
                this.priorityMatrix[i+7-7] = 0;
              }
            }
          } else {
            counter = 0;
          }
          i +=7;
        }
      }
      // Search diagonally (left to right and bottom to top)
      // Diagonal suchen (von links nach rechts und von unten nach oben)
      i = 1;
      while (i <= 15) {
        for (j=i; j<=i+3; j++) {
          chip = this.chipMatrix[j];
          if (chip == this.player) {
            counter = 0;
            for (m=1; m<=2; m++) {
              compchip = this.chipMatrix[j+(m*8)];
              if (chip == compchip) {
                counter +=1;
                if (counter == 2) {
                  this.priorityMatrix[j+((m+1)*8)-7] = 0;
                }
              } else {
                counter = 0;
              }
            }
          }
        }
        i +=7;
      }
      // Search diagonally (left to right and top to bottom)
      // Diagonal suchen (von links nach rechts und von oben nach unten)
      i = 22;
      while (i <= 36) {
        for (j=i; j<=i+3; j++) {
          chip = this.chipMatrix[j];
          if (chip == this.player) {
            counter = 0;
            for (m=1; m<=2; m++) {
              compchip = this.chipMatrix[j-(m*6)];
              if (chip == compchip) {
                counter +=1;
                if (counter == 2) {
                  if (i > 22) {
                    if (this.chipMatrix[j-(m*6)-6-7] == 2) {
                      this.priorityMatrix[j-(m*6)-6-7] = 0;
                    }
                  }
                }
              } else {
                counter = 0;
              }
            }
          }
        }
        i +=7;
      }
      // Search diagonally (right to left and bottom to top)
      // Diagonal suchen (von rechts nach links und von unten nach oben)
      i = 4;
      while (i <= 18) {
        for (j=i; j<=i+3; j++) {
          chip = this.chipMatrix[j];
          if (chip == this.player) {
            counter = 0;
            for (m=1; m<=2; m++) {
              compchip = this.chipMatrix[j+(m*6)];
              if (chip == compchip) {
                counter +=1;
                if (counter == 2) {
                  this.priorityMatrix[j+((m+1)*6)-7] = 0;
                }
              } else {
                counter = 0;
              }
            }
          }
        }
        i +=7;
      }
      // Search diagonally (right to left and top to bottom)
      // Diagonal suchen (von rechts nach links und von oben nach unten)
      i = 25;
      while (i <= 39) {
        for (j=i; j<=i+3; j++) {
          chip = this.chipMatrix[j];
          if (chip == this.player) {
            counter = 0;
            for (m=1; m<=2; m++) {
              compchip = this.chipMatrix[j-(m*8)];
              if (chip == compchip) {
                counter +=1;
                if (counter == 2) {
                  if (i > 25) {
                    if (this.chipMatrix[j-(m*8)-8-7] != 2) {
                      this.priorityMatrix[j-(m*8)-8-7] = 0;
                    }
                  }
                }
              } else {
                counter = 0;
              }
            }
          }
        }
        i +=7;
      }
      // Search for broken rows of 3/Nach unterbrochenen 3er-Reihen suchen
      // Horizontal H1  
      for (r=1; r<=5; r++) {
        for (s=3; s<=6; s++) {
          pos = r*7+s;
          if (this.chipMatrix[pos-1] == this.player && this.chipMatrix[pos-2] == this.player && this.chipMatrix[pos+1] == this.player) {
            this.priorityMatrix[pos-7] = 0;
          }
        }
      }
      // Horizontal H2
      for (r=1; r<=5; r++) {
        for (s=2; s<=5; s++) {
          pos = r*7+s;
          if (this.chipMatrix[pos-1] == this.player && this.chipMatrix[pos+1] == this.player && this.chipMatrix[pos+2] == this.player) {
            this.priorityMatrix[pos-7] = 0;
          }
        }
      }
      // Vertikal V1
      for (s=1; s<=7; s++) {
        for (r=1; r<=3; r++) {
          pos = s+r*7;
          if (this.chipMatrix[pos-7] == this.player && this.chipMatrix[pos+7] == this.player && this.chipMatrix[pos+14] == this.player) {
            this.priorityMatrix[pos-7] = 0;
          }
        }
      }
      // Vertikal V2
      for (s=1; s<=7; s++) {
        for (r=2; r<=4; r++) {
          pos = s+r*7;
          if (this.chipMatrix[pos-7] == this.player && this.chipMatrix[pos-14] == this.player && this.chipMatrix[pos+7] == this.player) {
            this.priorityMatrix[pos-7] = 0;
          }
        }
      }
      // Diagonal D1
      for (r=1; r<=3; r++) {
        for (s=2; s<=5; s++) {
          pos = r*7+s;
          if (this.chipMatrix[pos-8] == this.player && this.chipMatrix[pos+8] == this.player && this.chipMatrix[pos+16] == this.player) {
            this.priorityMatrix[pos-7] = 0;
          }
        }
      }
      // Diagonal D2
      for (r=2; r<=4; r++) {
        for (s=3; s<=6; s++) {
          pos = r*7+s;
          if (this.chipMatrix[pos-8] == this.player && this.chipMatrix[pos-16] == this.player && this.chipMatrix[pos+8] == this.player) {
            this.priorityMatrix[pos-7] = 0;
          }
        }
      }
      // Diagonal D3
      for (r=1; r<=3; r++) {
        for (s=3; s<=6; s++) {
          pos = r*7+s;
          if (this.chipMatrix[pos-6] == this.player && this.chipMatrix[pos+6] == this.player && this.chipMatrix[pos+12] == this.player) {
            this.priorityMatrix[pos-7] = 0;
          }
        }
      }
      // Diagonal D4
      for (r=2; r<=4; r++) {
        for (s=2; s<=5; s++) {
          pos = r*7+s;
          if (this.chipMatrix[pos-6] == this.player && this.chipMatrix[pos-12] == this.player && this.chipMatrix[pos+6] == this.player) {
            this.priorityMatrix[pos-7] = 0;
          }
        }
      }
    }
    /* Put a chip/Chip setzen */
    // Search priorityMatrix for the highest priority value/priorityMatrix nach höchstem Prioritätswert durchsuchen
    this.tempArray = [];
    for (i=1; i<=42; i++) {
      if (this.priorityMatrix[i] > 0) {
        this.tempArray.push([i,this.priorityMatrix[i]]);
      }
    }
    // Check for give up (priorityMatrix contains only zeros -> tempArray is empty)
    // Auf Aufgabe prüfen (priorityMatrix enthält nur Nullen -> tempArray ist leer)
    if (this.tempArray.length == 0) {
      // Computer gives up/Computer gibt auf
      this.meldungDiv.innerHTML = "<b>The computer gives up - you won!<b>";
      this.winning = true;
      // Hide ButtonDiv (end of game)/ButtonDiv ausblenden (Spielende)
      this.buttonDiv.style.display = 'none';
    } else {
      // Sort tempArray -> highest priority value is stored in tempArray[0][0]
      // tempArray sortieren -> höchster Prioritätswert ist in tempArray[0][0] gespeichert
      this.tempArray.sort((a, b) => b[1] - a[1]);
      // Search the array for fields with the same priority value
      // Array nach Feldern mit dem gleichen Prioritätswert durchsuchen
      i = 1;
      n = 0;
      j = this.tempArray[0][1];
      while (i < this.tempArray.length) {
        if (j == this.tempArray[i][1]) {
          n = i;
          j = this.tempArray[i][1];
        } else i = this.tempArray.length;
        i++;
      }
      // If n > zero there are several fields with the same priority value
      // Wenn n > Null existieren mehrere Felder mit gleichem Prioritätswert
      if (n > 0) {
        // Info:
        // If the algorithm is to be improved, further tests could follow here to determine the best move
        // -> maybe an idea for version 2?
        // Soll der Algorithmus verbessert werdem könnten hier weitere Prüfugen folgen, um den besten Zug zu ermitteln
        // -> vielleicht eine Idee für Version 2?
        if (n == 1) {
          // There are two equal priority values/Es existieren zwei gleiche Prioritätswerte
          // -> choose the value in the middle (arbitrary, the algorithm can also be improved here)
          // -> Wert in der Mitte wählen (willkürlich, auch hier ist eine Verbesserung des Algorithmus möglich)
          j = Math.abs(this.calcDropcolumn(this.tempArray[0][0]) - 4);
          m = Math.abs(this.calcDropcolumn(this.tempArray[1][0]) - 4);
          if (m < j) chipset = this.tempArray[1][0]; else chipset = this.tempArray[0][0];
        } else {
          // There are more than two equal priority values/Es existieren mehr als zwei gleiche Prioritätswerte
          // -> choose the value in the top row (n, arbitrary - an improvement is also conceivable here)
          // -> Wert in oberster Reihe wählen (n, willkürlich - auch hier ist eine Verbesserung denkbar)
          chipset = this.tempArray[n][0];
        }
      } else {
        // There is only one priority value/Es existiert nur ein Prioritätswert
        chipset = this.tempArray[0][0];
      }
      // Insert chip -> calculate column with calcDropcolumn() and start animation
      // Chip einwerfen -> Spalte mit calcDropcolumn() berechnen und Animation starten
      var dropColumn = this.calcDropcolumn(chipset);
      this.dropChip(dropColumn);
    }
  }
  /** Update Canvas */
  public update(ctx:CanvasRenderingContext2D):void {
    this.drawGamescene(ctx);
    this.drawChips(this.ctx);
  }
  /** Assign the newly calculated parameters (position and radius) to the chips
      Den Chips die neu berechneten Parameter (Position und Radius) zuweisen */
  public setChipParams():void {
    for (var i = 0; i < this.chipArray.length; i++) {
      // Write the new end center point in the chip/Neuen End-Center-Point in den Chip schreiben
      this.chipArray[i].cCenter = this.chipPositions[this.chipArray[i].icMatrix];
      // Write the new radius in the chip/Neuen Radius in den Chip schreiben
      this.chipArray[i].radius = this.chipRadius;
    }
  }
  /** Event Resize */
  onWindowResize = () => {
    fw.calcPlayfieldParams();
    fw.setChipParams();
    fw.update(this.ctx);
  }
}
/** Additional classes/Zusätzliche Klassen
 *  - Chip
 *  - Point
 *  - Kreis (circle)
 *  * Sorry, the following comments are in German, but the names indicate the respective functionality *
 */
/** Class Chip */
class Chip {
  public sCenter:Point = null;    // X-, Y-Koordinate des Chip-Zentrums (Start-Koordinaten für Animation)
  public eCenter:Point = null;    // X-, Y-Koordinate des Chip-Zentrums (End-Koordinaten für Animation)
  public radius:number = null;    // Radius des Chips
  public colnum:number = null;    // Color number (Spieler-Nummer, 0 = PC, 1 = Spieler)
  public icMatrix:number = null;  // Index im Array chipMatrix (für Neuberechnung der Chip-Positionen bei Resize)
  public cCenter:Point = null;    // Center-Point (aktuelle Position während der Animation)
  private fcolor:string = '';     // Fill color
  private scolor:string = '';     // Stroke color
  /**
  *   Konstruiert einen Spielchip im 2D-Raum
  *   @param sCenter   X-, Y-Koordinate des Spielchip-Zentrums (Start-Koordinate)
  *   @param eCenter   X-, Y-Koordinate des Spielchip-Zentrums (End-Koordinate)
  *   @param radius    Radius des Spielchips
  *   @param colnum    Color number (Spieler-Nummer, 0 = PC, 1 = Spieler)
  *   @param icMatrix  Index im Array chipMatrix (für Neuberechnung der Chip-Positionen bei Resize)
  */
  public constructor(sCenter:Point, eCenter:Point, radius:number, colnum:number, icMatrix:number) {
  	this.sCenter = sCenter;
  	this.eCenter = eCenter;
    this.radius  = radius;
    this.colnum = colnum;
    this.icMatrix = icMatrix;
  	this.cCenter = sCenter;
    this.fcolor  = '';
    this.scolor  = '';
  }
  /**
  *   Zeichnet einen Spielchip im 2D-Raum
  *   @param ctx - rendering context
  */
  public draw(ctx:CanvasRenderingContext2D):void {
    // Farbe definieren
    if (this.colnum == 0) {
      this.fcolor = 'red';
      this.scolor = 'darkred';
    } else {
      this.fcolor = 'yellow';
      this.scolor = 'darkyellow';
    }
    // Chip als Kreis zeichnen
    var k = new Kreis(this.cCenter, this.radius, 0, 2 * Math.PI, this.fcolor, this.scolor, 1, 'fillstroke');
    k.draw(ctx);  
  }
}
/** Class Point (2D-pos) */
class Point {
  x:number;
  y:number;
  constructor(x:number, y:number) {
    this.x = x;
    this.y = y;
  }
  add(p:Point) {
    return new Point(
      this.x + p.x,
      this.y + p.y
    );
  }
  subtract(p:Point) {
    return new Point(
      this.x - p.x,
      this.y - p.y
    );
  }
  copy() {
    return this.add(new Point(0, 0));
  }
  distanceTo(p:Point) {
    let dx = p.x - this.x;
    let dy = p.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  projectOntoCircle(point:Point, radius:number) {
    let angle = this.getAngleBetween(point);
    let newX = point.x + Math.cos(angle) * radius;
    let newY = point.y + Math.sin(angle) * radius;
    return new Point(newX, newY);
  }
  getAngleBetween(point:Point) {
    let delta = this.subtract(point);
    let angle = Math.atan2(delta.y, delta.x);
    return angle;
  }
}
/** Class Kreis (2D-Circle)
    Verwendet  arc()
    JS-Syntax  context.arc(x,y,r,sAngle,eAngle[,counterclockwise]);
*/
class Kreis {
  public cCenter:Point = null;
  public r:number      = 0;
  public sAngle:number = 0;
  public eAngle:number = 0;
  public fcolor:string = '';
  public scolor:string = '';
  public lwidth:number = 0;
  public dflag:string  = '';
  /**
  *   Konstruiert einen Kreis im 2D-Raum
  *   @param cCenter  X-, Y-Koordinate des Kreis-Zentrums
  *   @param r        Radius des Kreises
  *   @param sAngle   Startwinkel, in Rad
  *   @param eAngle   Endwinkel, in Rad
  *   @param fcolor   Fill color
  *   @param scolor   Stroke color
  *   @param lwidth   Line width
  *   @param dflag    Draw-Flag: fill, stroke oder fillstroke
  */
  public constructor(cCenter:Point, r:number, sAngle:number, eAngle:number, fcolor:string, scolor:string, lwidth:number, dflag:string) {
  	this.cCenter = cCenter;
    this.r       = r;
    this.sAngle  = sAngle;
    this.eAngle  = eAngle;
    this.fcolor  = fcolor;
    this.scolor  = scolor;
    this.lwidth  = lwidth;
    this.dflag   = dflag;
  }
  /**
  *   Zeichnet einen Kreis im 2D-Raum
  *   @param ctx - rendering context
  */
  public draw(ctx:CanvasRenderingContext2D):void {
    ctx.beginPath();
    ctx.arc(this.cCenter.x, this.cCenter.y, this.r, this.sAngle, this.eAngle);
    switch(this.dflag) {
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