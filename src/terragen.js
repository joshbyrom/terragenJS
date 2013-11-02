var Terragen = function () {
    this.canvas = document.getElementById('canvas');
    this.context = canvas.getContext('2d');

    this.active = true;
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
        }
    }.bind(this);

    requestAnimationFrame(loop);
}

Terragen.prototype.drawText = function(text, x, y, font, fillStyle) {
    this.context.font = font || '16pt Arial';
    this.context.fillStyle = fillStyle || 'cornflowerblue';

    this.context.fillText(text, x, y);
};

function addEvent(target, event, fnc) {
    var onEvent = 'on' + event;

    if (typeof target.addEventListener != "undefined")
        target.addEventListener(event, fnc, false);
    else if (typeof window.attachEvent != "undefined") {
        target.attachEvent(onEvent, fnc);
    }
    else {
        if (target.onEvent !== null) {
            var oldOnload = target.onEvent;
            target.onEvent = function (e) {
                oldOnload(e);
                target[fnc]();
            };
        }
        else
            target.onEvent = fnc;
    }
}

addEvent(window, 'load', function () {
    var app = new Terragen();
    app.start(
        function () {

        },

        function() {
            this.drawText('Hello, Canvas', canvas.width * 0.5, canvas.height * 0.5, '16pt Arial', 'cornflowerblue');
        }
    );

    app.start();
});