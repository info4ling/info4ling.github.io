
var glyph_data = null;

function set_glyph_data(orig) {
    // shallow copy
    glyph_data = orig;
}

function draw_glyph_line(context, shift, point1, point2) {
    var rpos1 = glyph_data['P'][point1];
    var rpos2 = glyph_data['P'][point2];
    const X = 0;
    const Y = 1;
    var adj = shift ? IMG_W / -2 : 0;

    context.fillStyle = '#000000';
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(adj + (rpos1[X] * IMG_W / 2), rpos1[Y] * IMG_H / 2);
    context.lineTo(adj + (rpos2[X] * IMG_W / 2), rpos1[Y] * IMG_H / 2);
    context.stroke();
    context.closePath();
}

function draw_glyph_stroke(context, what, which, shift) {
    var data = glyph_data[what][which];
    draw_glyph_line(context, shift, ...data);
}

function draw_glyph_row(context, r1, r2, r4, r8) {
    if (r1) {
        draw_glyph_stroke(context, 'R', '1', false);
    }
    if (r2) {
        draw_glyph_stroke(context, 'R', '2', false);
    }
    if (r4) {
        draw_glyph_stroke(context, 'R', '4', false);
    }
    if (r8) {
        draw_glyph_stroke(context, 'R', '8', false);
    }
}

function draw_glyph_col(context, shift, c1, c2, r4) {
    if (c1) {
        draw_glyph_stroke(context, 'C', '1', shift);
    }
    if (c2) {
        draw_glyph_stroke(context, 'C', '2', shift);
    }
    if (c4) {
        draw_glyph_stroke(context, 'C', '4', shift);
    }
}

function draw_glyph_center(context) {
    draw_glyph_stroke(context, 'X', '0', shift);
}

function mk_glyph(name, r1, r2, r4, r8, c1, c2, c4) {
    var canvas = makeCanvas(IMG_W, IMG_H);
    var context = canvas.getContext('2d');

    draw_glyph_row(context, r1, r2, r4, r8);
    draw_glyph_center(context);
    draw_glyph_col(context, false, c1, c2, r4);

    saveImage(canvas, name);

    return canvas;
}

function makeCanvas(wsz, hsz) {
    var canvas = document.createElement('canvas');

    canvas.width = wsz;
    canvas.height = hsz;

    return canvas;
}

function saveImage(original, name) {
    var URI = original.toDataURL('image/png');
    stored_images[name] = URI;
}

function getImage(name, rsz) {
    var dataURI = stored_images[name];
    var image = document.createElement('img');
    image.src = dataURI;
    image.width = rsz;
    image.height = rsz;
    return image;
}

