var Terragen = function () {
    this.canvas = document.getElementById('canvas');
    this.context = canvas.getContext('2d');

    this.active = true;

    this._objects = [];
};

Number.prototype.mod = function(number) {
    return ((this%number)+number)%number;
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
            var realColumn = column.mod(this.width);
            var realRow = row.mod(this.height);

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

        this.Grid.prototype.mapRegion = function(startX, startY, endX, endY, callback) {
            for(var i = startX, localColumn = 0; i < endX; ++i, ++localColumn, localRow=0) {
                for(var j = startY, localRow = 0; j < endY; ++j, ++localRow) {
                    callback(this.get(i, j), localColumn, localRow);
                }
            }
        };

        this.Grid.prototype._toIndex = function(column, row) {
            var index = parseInt(column * this.width + row);
            return index;
        };
    };

    return new this.Grid();
};

Terragen.prototype.createAgent = function(group) {
	var Agent = function(group) {
		this.group = group;

		if(this.group !== undefined) {
			this.group.size += 1;
		}
	}

	Agent.prototype.getAnimation = function() {
		return this.group.animation;
	};

	Agent.prototype.getName = function() {
		return this.group.name;
	};

	Agent.prototype.getIsSameGroup = function(other) {
		return other.getName() === this.getName();
	};

	Agent.prototype.getAttitudeTowards = function(other) {
		if(other === null || other === undefined) return 0;
		else return this.group.getAttitudeTowards(other.group);
	};

	return new Agent(group);
};

Terragen.prototype.createGroup = function(name, animation) {
	var Group = function(name, animation) {
		this.name = name;
		this.animation = animation;

		this.size = 0;

		this.selfAttitude = 1;
		this.baseAttitude = -1;

		this.attitudes = {};
	};

	Group.prototype.getAttitudeTowards = function(other) {
		if(other.name === this.name) {
			return this.selfAttitude;
		} else {
			if(this.attitudes.hasOwnProperty(other.name)) {
				return this.attitudes[other.name](this, other);
			} else {
				return this.baseAttitude;
			}
		}
	}

	Group.prototype.setAttitudeTowards = function(other, callback) {
		this.attitudes[other.name] = callback.bind(this);
	};

	return new Group(name, animation);
};

Terragen.prototype.createGroupLogic = function(grid, groups) {
	var self = this;

	var GroupLogic = function(grid, groups) {
		this.grid = grid;
		this.groups = groups;

		this.birthChance = 0.55;
		this.initialRange = 2;
		this.extendedRange = 4;
	};

	GroupLogic.prototype.update = function() {
		this.grid.map(this.handleCell.bind(this));
		this.grid.map(this.pushNextState);
	};

	GroupLogic.prototype.pushNextState = function(cell) {
		cell.state = cell.nextState;
	};

	GroupLogic.prototype.handleCell = function(cell) {
		var state = cell.state || 'unknown';
		if(state === 'unknown') {
			if(self.range(0, 1) < this.birthChance) {
				cell.agent = this.createAgent();
				cell.nextState = 'occupied';
			} else {
				cell.nextState = 'empty';
				cell.agent = undefined;
			}
		} else if(state === 'occupied') {
			this.determineMove(cell, this.initialRange);
		}
	};

	GroupLogic.prototype.createAgent = function() {
		var index = Math.floor(Math.random() * this.groups.length);
		return self.createAgent(this.groups[index]);
	};

	GroupLogic.prototype.determineMove = function(cell, range) {
		var halfRange = parseInt(range * 0.5);

		var sx = cell.column-halfRange,
		    sy = cell.row-halfRange,
		    ex = cell.column+halfRange,
		    ey = cell.row+halfRange;

		var self = this;
		var currentValue = 0, highestValue = this.getCellValue(cell, cell, range), result = cell;
		this.grid.mapRegion(sx, sy, ex, ey, function(mappedCell, lc, ly) {
			if(mappedCell.column === cell.column && mappedCell.row === cell.row) return;
		
			if(mappedCell.state === 'empty' && mappedCell.nextState !== 'occupied') {
				currentValue = self.getCellValue(cell, mappedCell, range);

				if(currentValue > highestValue) {
					highestValue = currentValue;
					result = mappedCell;
				}
			}
		});

		if(result !== cell) {
			this.moveCell(cell, result);
		} else if(range < this.extendedRange) {
			this.determineMove(cell, ++range);
		}
	};

	GroupLogic.prototype.getCellValue = function(cell, other, range) {
		var attitude = 0;

		var halfRange = parseInt((range || this.initialRange) * 0.5);

		var sx = other.column-halfRange,
		    sy = other.row-halfRange,
		    ex = other.column+halfRange,
		    ey = other.row+halfRange;

		this.grid.mapRegion(sx, sy, ex, ey, function(mappedCell, lc, ly) {
			if(mappedCell.column === cell.column && mappedCell.row === cell.row) return;

			attitude += cell.agent.getAttitudeTowards(mappedCell.agent);
		});

		return attitude;
	};

	GroupLogic.prototype.moveCell = function(cell, target) {
		var tmp = target.agent;

		target.nextState = cell.state;
		target.agent = cell.agent;

		cell.nextState = target.state;
		cell.agent = tmp;
	};

	return new GroupLogic(grid, groups);
};

Terragen.prototype.createAnimation = function(uri, frameWidth, frameHeight, callback) {
	var image = new Image;
	var self = this;

	image.onload = function() {
		var animation = function(image, frameWidth, frameHeight) {
			this.image = image;

			this.frameWidth = frameWidth;
			this.frameHeight = frameHeight;

			this.framesPerColumn = parseInt(image.width / this.frameWidth);
			this.framesPerRow = parseInt(image.height / this.frameHeight);

			this.currentFrameX = 0;
			this.currentFrameY = 0;

			this.scaleX = 1;
			this.scaleY = 1;
		};

		animation.prototype.drawCurrentImage = function(x, y) {
			var sx = parseInt(this.currentFrameX * this.frameWidth),
			    sy = parseInt(this.currentFrameY * this.frameHeight);

			var dw = parseInt(this.frameWidth * this.scaleX),
			    dh = parseInt(this.frameHeight * this.scaleY);

			self.context.drawImage(this.image, sx, sy, this.frameWidth, this.frameHeight, x, y, dw, dh);
		};

		callback(new animation(image, frameWidth, frameHeight));
	};
	image.src = uri;
};

Terragen.prototype.createAnimationDriver = function(animation, duration) {
	var AnimationDriver = function(animation, duration) {
		this.animation = animation;

    	this.scaleX = 2;
    	this.scaleY = 2;

    	this.counter = 0;
    	this.duration = duration || 4;

    	animation.driver = this;
    };

    AnimationDriver.prototype.update = function() {
    	this.counter++;

        if(this.counter > this.duration) {
            this.counter = 0;
            this.animation.currentFrameX += 1;

            if(this.animation.currentFrameX >= this.animation.framesPerColumn) {
               	this.animation.currentFrameX = 0;
            }
        }
   	};

	var result = new AnimationDriver(animation, duration);
	this._objects.push(result);
	return result;
};

Terragen.prototype.start = function(update, render, callback) {
    this.update = update || function() { this.active = false; };
    this.render = render || function() {};

    this.update = this.update.bind(this);
    this.render = this.render.bind(this);

    var loop = function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);   

        this.render();

        var obj = undefined;
        for (var i = this._objects.length - 1; i >= 0; i--) {
        	obj = this._objects[i];

        	if(obj.update) {
        		obj.update();
        	}

        	if(obj.render) {
        		obj.render();
        	}
        };

        this.update();

        if(this.active) {
            requestAnimationFrame(loop);
        } else if(callback !== undefined) {
            this.callback.apply(this);
        }
    }.bind(this);

    requestAnimationFrame(loop.bind(this));
}

Terragen.prototype.range = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
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

Terragen.prototype.drawLine = function(startX, startY, endX, endY, strokeStyle, lineWidth, lineJoin, lineCap) {
    this.context.lineWidth = lineWidth || 1;
    this.context.lineCap = lineCap || "round";
    this.context.lineJoin = lineJOin || "round";
    this.context.strokeStyle = strokeStyle || "green";

    this.context.beginPath();
    this.context.moveTo(startX, startY);
    this.context.lineTo(endX, endY);
    this.context.closePath();
    this.context.stroke();
};

// parameters 'points' is an array of two tuple values
Terragen.prototype.drawPolygon = function(x, y, points, strokeStyle, fillStyle, lineWidth, lineJoin, lineCap) {
    this.context.lineWidth = lineWidth || 1;
    this.context.lineCap = lineCap || "round";
    this.context.lineJoin = lineJoin || "round";
    this.context.strokeStyle = strokeStyle || "green";
    this.context.fillStyle = fillStyle || "#f00";
    
    this.context.beginPath();
    this.context.moveTo(x + points[points.length-1][0], y + points[points.length-1][1]);
    for (var i = points.length - 2; i >= 0; i--) {
    	this.context.lineTo(x + points[i][0], y + points[i][1]);
    };
    this.context.closePath();
    this.context.stroke();
    this.context.fill()
};


// app specific stuff
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
};

addEvent(window, 'load', function () {
    var app = new Terragen();

    var groups = [];
    var grassGroup = app.createGroup('grass', undefined);
    var dirtGroup = app.createGroup('dirt', undefined);
    groups.push(grassGroup);
    groups.push(dirtGroup);

    app.createAnimation('grass.png', 32, 32, function(animation) {
    	app.createAnimationDriver(animation);
    	
    	grassGroup.animation = animation;
    });

    app.createAnimation('dirt.png', 32, 32, function(animation) {
    	app.createAnimationDriver(animation);
    	
    	dirtGroup.animation = animation;
    });

    var cellWidth = 32, cellHeight = 32;

    var grid = app.createGrid(100, 100);
    var cellGenerator = function(grid, column, row) {
        var Cell = function() {
            this.column = column;
            this.row = row;

            this.width = cellWidth;
            this.height = cellHeight;

            this.mouseOver = false;
        };

        Cell.prototype.onMouseEnter = function(callback) {
        	// do something

        	if(callback) callback(this);
        };

        Cell.prototype.onMouseExit = function(callback) {
        	// do something

        	if(callback) callback(this);
        };

        Cell.prototype.render = function(x, y) {
        	if(this.agent) {
        		if(this.agent.getAnimation()) {
        			this.agent.getAnimation().drawCurrentImage(x, y);
        		} else {
		            app.drawPolygon(x, y, [[0,0], [this.width, 0], [this.width, this.height], [0, this.height]], undefined, this.mouseOver ? 'blue' : undefined);
            	}
        	}
        };

        return new Cell();
    };

    var groupLogic = app.createGroupLogic(grid, groups);

    var cameraX = 0, cameraY = 0;
    var columnsPerScreen = parseInt((app.canvas.width + (cellWidth * 2.0)) / cellWidth),
        rowsPerScreen = parseInt((app.canvas.height + (cellHeight * 2.0))/ cellHeight);

    var startCellX = cameraX / cellWidth,
        startCellY = cameraY / cellHeight,
        offsetX = 0, offsetY = 0, cameraSpeed = 11;

    var keys = [];

    var moveCamera = function(x, y) {
        cameraX += x || 0;
        cameraY += y || 0;

        startCellX = parseInt(cameraX / cellWidth),
        startCellY = parseInt(cameraY / cellHeight);

        offsetX = cameraX - (startCellX * cellWidth);
        offsetY = cameraY - (startCellY * cellHeight);

        onMouseMoved();
    };

    var lastMouseX = 0, lastMouseY = 0;
    var lastCellMouseOver = undefined;
    var onMouseMoved = function(e) {
		var scaleModX = app.canvas.width / app.canvas.offsetWidth;
		var scaleModY = app.canvas.height / app.canvas.offsetHeight;

    	var mouseX = cameraX + (e ? e.clientX : lastMouseX) * scaleModX, 
    	    mouseY = cameraY + (e ? e.clientY : lastMouseY) * scaleModY;

    	var cellX = parseInt(mouseX / cellWidth), 
    	    cellY = parseInt(mouseY / cellHeight);

    	var cell = grid.get(mouseX < 0 ? --cellX : cellX, mouseY < 0 ? --cellY : cellY);
    	if(!cell.mouseOver) {
    		cell.onMouseEnter();
    		cell.mouseOver = true;
    	} 

    	if(lastCellMouseOver !== undefined && cell !== lastCellMouseOver) {
    		lastCellMouseOver.mouseOver = false;
    		lastCellMouseOver.onMouseExit();
    	}

    	lastCellMouseOver = cell;
    	if(e) {
    		lastMouseY = e.clientY;
    		lastMouseX = e.clientX;
    	}
    };

    window.addEventListener('mousemove', onMouseMoved);

    window.addEventListener('keydown', function(e) {
        keys[e.keyCode] = true;
    });

    window.addEventListener('keyup', function(e) {
        keys[e.keyCode] = false;
    });

    app.createAnimation('base.png', 16, 16, function(animation) {
    	app.createAnimationDriver(animation).render = function render () {
    		animation.drawCurrentImage((0-cameraX).mod(grid.width * cellWidth), (0-cameraY).mod(grid.height * cellHeight));
    	}
    });

    var render = function render() {
        grid.mapRegion(startCellX-1, startCellY-1, startCellX + columnsPerScreen, startCellY + rowsPerScreen, function(cell, localColumn, localRow) {
            var x = localColumn * cell.width - offsetX - cell.width;
            var y = localRow  * cell.height - offsetY - cell.height;

            var centerX = x + (cell.width * 0.5);
            var centerY = y + (cell.height * 0.5);
                    
            if(cell.render) cell.render(x, y);
            else {
	            app.drawPolygon(x, y, [[0,0], [cell.width, 0], [cell.width, cell.height], [0, cell.height]], undefined, cell.mouseOver ? 'blue' : undefined);
	            app.drawText(cell.column + ', ' + cell.row, '6pt Arial', 'blue', function(width) {
	                this.x = (centerX - (width * 0.5));
	                this.y = (centerY - 3);
	            });
            }
        }.bind(app));
    };

    var logicTimer = 0;
    var logicLimit = 5;
    grid.init(cellGenerator, function() {
        app.start(
            function update() {
                if(keys[87]) {
                    moveCamera(0,-cameraSpeed);
                }

                if(keys[83]) {
                    moveCamera(0,cameraSpeed);
                }

                if(keys[65]) {
                    moveCamera(-cameraSpeed);
                }

                if(keys[68]) {
                    moveCamera(cameraSpeed);
                }

                logicTimer += 1;
                if(logicTimer > 100 && logicLimit-- > 0) {
                	groupLogic.update();
                	groupLogic.update();
                	groupLogic.update();
                	groupLogic.update();
                	groupLogic.update();
                	groupLogic.update();
                	groupLogic.update();

                	logicTimer = 0;
                }
            }, render);
    });
});