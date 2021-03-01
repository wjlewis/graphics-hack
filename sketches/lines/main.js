var canvas = document.getElementsByTagName("canvas")[0];
var ctx = canvas.getContext("2d", { alpha: false });

var PX_SIDE = 20;

function drawLine(srcX, srcY, dstX, dstY, data, color) {
    var dX = dstX - srcX;
    var dY = dstY - srcY;

    if (Math.abs(dY) < Math.abs(dX)) {
        if (dstX < srcX) {
            // Swap src and dst
            var tmp = srcX;
            srcX = dstX;
            dstX = tmp;

            tmp = srcY;
            srcY = dstY;
            dstY = tmp;

            dX *= -1;
            dY *= -1;
        }

        var sign = dstY > srcY ? 1 : -1;
        var m = sign * 2 * dY;
        var e = 0;

        var y = srcY;
        for (var x = srcX; x <= dstX; x++) {
            drawPx(x, y, data, color);
            e += m;
            if (e >= dX) {
                y += sign;
                e -= 2 * dX;
            }
        }
    } else {
        if (dstY < srcY) {
            // Swap src and dst
            var tmp = srcX;
            srcX = dstX;
            dstX = tmp;

            tmp = srcY;
            srcY = dstY;
            dstY = tmp;

            dX *= -1;
            dY *= -1;
        }

        var sign = dstX > srcX ? 1 : -1;
        var m = sign * 2 * dX;
        var e = 0;

        var x = srcX;
        for (var y = srcY; y <= dstY; y++) {
            drawPx(x, y, data, color);
            e += m;
            if (e >= dY) {
                x += sign;
                e -= 2 * dY;
            }
        }
    }
}

function drawPx(x, y, data, color) {
    color = color || [255, 255, 255];

    for (var py = y * PX_SIDE; py < y * PX_SIDE + PX_SIDE; py++) {
        for (var px = x * PX_SIDE; px < x * PX_SIDE + PX_SIDE; px++) {
            var offset = (py * canvas.width + px) * 4;

            data[offset] = color[0];
            data[offset + 1] = color[1];
            data[offset + 2] = color[2];
        }
    }
}

function clear(data, color) {
    color = color || [0, 0, 0];

    for (var c = 0; c < canvas.width * canvas.height * 4; c += 4) {
        data[c] = color[0];
        data[c + 1] = color[1];
        data[c + 2] = color[2];
    }
}

//
//
//

var canvasLeft;
var canvasTop;

function computeCanvasBounds() {
    var bounds = canvas.getBoundingClientRect();
    canvasLeft = bounds.left;
    canvasTop = bounds.top;
}

window.addEventListener("resize", computeCanvasBounds);
computeCanvasBounds();

var srcX = 14;
var srcY = 8;

var img = ctx.getImageData(0, 0, canvas.width, canvas.height);
clear(img.data, [50, 50, 50]);
drawPx(srcX, srcY, img.data, [255, 255, 0]);
ctx.putImageData(img, 0, 0);

canvas.addEventListener("mousemove", function (e) {
    const mouseX = Math.floor((e.clientX - canvasLeft) / PX_SIDE);
    const mouseY = Math.floor((e.clientY - canvasTop) / PX_SIDE);

    window.requestAnimationFrame(function () {
        clear(img.data, [50, 50, 50]);
        drawLine(srcX, srcY, mouseX, mouseY, img.data, [0, 255, 255]);
        drawPx(srcX, srcY, img.data, [255, 255, 0]);
        drawPx(mouseX, mouseY, img.data, [255, 0, 255]);
        ctx.putImageData(img, 0, 0);
    });
});
