var Terragen = function (update, render) {
    this.canvas = document.getElementById('canvas');
    this.context = canvas.getContext('2d');

    this.update = update || function() { this.active = false; };
    this.render = render || function() {};

    this.update = this.update.bind(this);
    this.render = this.render.bind(this);

    this.active = true;
};

Terragen.prototype.start = function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);   

    this.update();
    this.render();

    if(this.active) requestAnimationFrame(this.start.bind(this));
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
    var app = new Terragen(
        function () {

        },

        function() {
            this.drawText('Hello, Canvas', canvas.width * 0.5, canvas.height * 0.5, '16pt Arial', 'cornflowerblue');
        }
    );

    app.start();
});