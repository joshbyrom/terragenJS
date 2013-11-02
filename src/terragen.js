var Terragen = function () {
    this.canvas = document.getElementById('canvas');
    this.context = canvas.getContext('2d');

    this.active = true;
};

Terragen.prototype.createGrid = function(width, height) {
    if(!this.hasOwnProperty('Grid')) {
        this.Grid = function() {
            this.width = width;
            this.height = height;

            this.cells = [];
        }

        this.Grid.prototype.init = function(cellGenerator, callback) {
            for(var i = 0; i < width; ++i) {
                for(var j = 0; j < height; ++j) {
                    this.cells.push(cellGenerator(this, i, j));
                }
            }
            callback.apply(this);
        };

        this.Grid.prototype._guardedIndex = function(column, row) {
            var realColumn = column % this.width;
            var realRow = row % this.height;

            if(realColumn < 0) {
                realColumn += this.width;
            }

            if(realRow < 0) {
                realRow += this.height;
            }

            var index = this._toIndex(realColumn, realRow)
            return index;
        }

        this.Grid.prototype.get = function(column, row) {
            var index = this._guardedIndex(column, row);
            return this.cells[index];
        };

        this.Grid.prototype.set = function(column, row, value) {
            var index = this._guardedIndex(column, row);
            this.cells[index] = value;
        }

        this.Grid.prototype.map = function(callback) {
            for (var i = this.cells.length - 1; i >= 0; i--) {
                callback(this.cells[i]);
            };
        };

        this.Grid.prototype._toIndex = function(column, row) {
            var index = column * this.width + row;
            return index;
        };
    };

    return new this.Grid();
};

Terragen.prototype.start = function(update, render, callback) {
    this.update = update || function() { this.active = false; };
    this.render = render || function() {};

    this.update = this.update.bind(this);
    this.render = this.render.bind(this);

    var loop = function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);   

        this.render();
        this.update();

        if(this.active) {
            requestAnimationFrame(loop);
        } else if(callback !== undefined) {
            this.callback.apply(this);
            console.log('simulation ended');
        }
    }.bind(this);

    console.log('simulation started');
    requestAnimationFrame(loop.bind(this));
}

Terragen.prototype.drawText = function(text, font, fillStyle, callback) {
    this.context.font = font || '16pt Arial';
    this.context.fillStyle = fillStyle || 'cornflowerblue';

    this.context.textBaseline = 'top';

    var metrics = this.context.measureText(text);
    var width = metrics.width;

    callback.apply(callback, [width]);

    this.context.fillText(text, callback.x, callback.y);
};

function addEvent(target, event, fnc) {
    var onEvent = 'on' + event;

    if (typeof target.addEventListener != "undefined")
        target.addEventListener(event, fnc, false);
    else if (typeof window.attachEvent != "undefined") {
        target.attachEvent(onEvent, fnc);
    } else {
        if (target.onEvent !== null) {
            var oldOnload = target.onEvent;
            target.onEvent = function (e) {
                oldOnload(e);
                target[fnc]();
            };
        } else {
            target.onEvent = fnc;
        }
    }
}

addEvent(window, 'load', function () {
    var app = new Terragen();

    var grid = app.createGrid(100, 100);
    var cellGenerator = function(grid, column, row) {
        var Cell = function() {
            this.column = column;
            this.row = row;

            this.width = 8;
            this.height = 8;
        };

        return new Cell();
    };

    grid.init(cellGenerator, function() {
        app.start(
            function () {
                app.active = false;
            },

            function() {
                grid.map(function(cell) {
                    var x = cell.column * cell.width;
                    var y = cell.row * cell.height;

                    var centerX = x + (cell.width * 0.5);
                    var centerY = y + 3;

                    var text = grid._toIndex(cell.column, cell.row);
                    
                    this.drawText(0, '6pt Arial', 'blue', function(width) {
                        this.x = centerX - width * 0.5;
                        this.y = centerY - 3;
                    });

                    console.log('drawing cell ' + cell);
                }.bind(app));
            }
        );
    });
});