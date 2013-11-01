var Terragen = function () {
    this.canvas = document.getElementById('canvas');
    this.context = canvas.getContext('2d');

    this.drawText('Hello, Canvas', canvas.width * 0.5 - 150, canvas.height * 0.5 + 15, '16pt Arial', 'cornflowerblue');
};

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
    new Terragen();
});