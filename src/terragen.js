var Terragen = function () {
    var canvas = document.getElementById('canvas'),
        context = canvas.getContext('2d');

    context.font = '16pt Arial';
    context.fillStyle = 'cornflowerblue';
    context.strokeStyle = 'blue';

    context.fillText('Hello, Canvas', canvas.width * 0.5 - 150, canvas.height * 0.5 + 15);
    //context.strokeText('Hello, Canvas', canvas.width * 0.5 - 150, canvas.height * 0.5 + 15);
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
    new terragen();
});