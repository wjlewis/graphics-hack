function Vec3(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
}

Vec3.prototype.length = function () {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
};

Vec3.prototype.normalize = function () {
    var length = this.length();
    if (length === 0) {
        throw new Error("cannot normalize zero vector");
    }
    return new Vec3((this.x /= length), (this.y /= length), (this.z /= length));
};

Vec3.prototype.minus = function (v) {
    return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z);
};

Vec3.prototype.dot = function (v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
};

Vec3.prototype.scale = function (f) {
    return new Vec3(this.x * f, this.y * f, this.z * f);
};

Vec3.prototype.isZero = function () {
    return this.x === 0 && this.y === 0 && this.z === 0;
};

Vec3.prototype.project = function (v) {
    if (v.isZero()) {
        return new Vec3(0, 0, 0);
    }

    var thisLen = this.length();
    var vLen = v.length();

    var cosTheta = this.dot(v) / (thisLen * vLen);
    return v.normalize().scale(thisLen * cosTheta);
};

function Transform(mat) {
    this.mat = mat;
}

Transform.from = function (src, dst) {
    return new Transform([
        [
            dst[0].project(src[0]).length(),
            dst[0].project(src[1]).length(),
            dst[0].project(src[2]).length(),
        ],
        [
            dst[1].project(src[0]).length(),
            dst[1].project(src[1]).length(),
            dst[1].project(src[2]).length(),
        ],
        [
            dst[2].project(src[0]).length(),
            dst[2].project(src[1]).length(),
            dst[2].project(src[2]).length(),
        ],
    ]);
};

Transform.prototype.transform = function (v) {
    return new Vec3(
        this.mat[0][0] * v.x + this.mat[0][1] * v.y + this.mat[0][2] * v.z,
        this.mat[1][0] * v.x + this.mat[1][1] * v.y + this.mat[1][2] * v.z,
        this.mat[2][0] * v.x + this.mat[2][1] * v.y + this.mat[2][2] * v.z
    );
};

function Camera(w, h, fl, pos, ox, oy, oz) {
    this.w = w;
    this.h = h;
    this.fl = fl;
    this.pos = pos;

    this.ox = ox.normalize();
    this.oy = oy.normalize();
    this.oz = oz.normalize();
}

Camera.prototype.getTransform = function () {
    return Transform.from(
        [new Vec3(1, 0, 0), new Vec3(0, 1, 0), new Vec3(0, 0, 1)],
        [this.ox, this.oy, this.oz]
    );
};

Camera.prototype.setPos = function (p) {
    this.pos = p;
};

Camera.prototype.setOrientation = function (ox, oy, oz) {
    this.ox = ox.normalize();
    this.oy = oy.normalize();
    this.oz = oz.normalize();
};

Camera.prototype.project = function (trans, p, vw, vh) {
    var to = p.minus(this.pos);
    var toC = trans.transform(to);
    var z = -toC.z;

    if (z < 1) {
        return undefined;
    }

    var scaleF = this.fl / z;

    var x = toC.x * scaleF;
    var y = toC.y * scaleF;

    if (x > this.w || x < -this.w || y > this.h || y < -this.h) {
        return undefined;
    }

    return new Vec3(
        Math.floor(vw / 2 + x * (vw / this.w)),
        Math.floor(vh / 2 - y * (vh / this.h)),
        z
    );
};

// Projection and normalization are expensive.
// However, multiplication is less so.
// Thus, computing the camera transformation is fairly expensive, but
// computing vertex positions is less so.

//
// Mucking around -----------------------------------------------------
//

var canvas = document.getElementsByTagName("canvas")[0];
var ctx = canvas.getContext("2d", { alpha: false });

var cam = new Camera(
    3,
    2,
    2,
    new Vec3(4, 0, 0),
    new Vec3(0, 1, 0),
    new Vec3(0, 0, 1),
    new Vec3(1, 0, 0)
);

// In world coords
var cube = [
    new Vec3(0, 0, 0),
    new Vec3(1, 0, 0),
    new Vec3(1, 1, 0),
    new Vec3(0, 1, 0),
    new Vec3(0, 0, 1),
    new Vec3(1, 0, 1),
    new Vec3(1, 1, 1),
    new Vec3(0, 1, 1),
];

var img = ctx.getImageData(0, 0, canvas.width, canvas.height);

function loop() {
    cam.setPos(
        new Vec3(cam.pos.x + 0.004, cam.pos.y + 0.003, cam.pos.z + 0.005)
    );

    for (var i = 0; i < canvas.width * canvas.height; i++) {
        img.data[i * 4] = 0;
        img.data[i * 4 + 1] = 0;
        img.data[i * 4 + 2] = 0;
    }

    var ct = cam.getTransform();

    for (var i = 0; i < cube.length; i++) {
        var p = cam.project(ct, cube[i], canvas.width, canvas.height);

        if (p === undefined) {
            continue;
        }

        for (var x = p.x - 2; x <= p.x + 2; x++) {
            for (var y = p.y - 2; y <= p.y + 2; y++) {
                var base = (y * canvas.width + x) * 4;
                img.data[base] = 255;
                img.data[base + 1] = 255;
                img.data[base + 2] = 0;
            }
        }
    }

    ctx.putImageData(img, 0, 0);

    window.requestAnimationFrame(loop);
}

loop();
