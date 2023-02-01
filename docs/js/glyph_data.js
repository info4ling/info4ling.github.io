
var glyph_data = {};
const stored_images = {};

/*
** GLYPH DATA **
P:
  PT | X | Y

  PT == name of point
      X -- [0 -- 1  -- 2]
      Y transpose of X

  GLYPH DATA{'P'}{PT}=[X, Y]

R: row (left)
C: col (left)
X: center (bit is 0)
  BIT | PT FROM | PT TO

  BIT == AND value
     PT FROM -- name of starting point
     PT TO -- name of ending point

  GLYPH DATA{'R'}{1/2/4/8}=[FROM, TO]
  GLYPH DATA{'C'}{1/2/4}=[FROM, TO]
  GLYPH DATA{'X'}{0}=[FROM, TO]

*/

function set_glyph_data(arr) {
    var what = arr[0];
    var sub = arr[1];
    var a = arr[2];
    var b = arr[3];
    glyph_data[what][sub] = [a, b];
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

function draw_glyph_col(context, shift, c1, c2, c4) {
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
    draw_glyph_col(context, false, c1, c2, c4);

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

function col_hdr_glyph(col, size) {
    var name = 'C' + col;
    if (!(name in stored_images)) {
        var canvas = makeCanvas(IMG_W, IMG_H);
        var context = canvas.getContext('2d');

        draw_glyph_col(context, true, col & 1, col & 2, col & 4);
        saveImage(canvas, name);
    }

    return getImage(name, size);
}

function row_hdr_glyph(row, size) {
    var name = 'R' + row;
    if (!(name in stored_images)) {
        var canvas = makeCanvas(IMG_W, IMG_H);
        var context = canvas.getContext('2d');

        draw_glyph_row(context, row & 1, row & 2, row & 4, row & 8);
        saveImage(canvas, name);
    }

    return getImage(name, size);
}

function cell_glyph(row, col, size) {
    var name = 'R' + row + 'C' + col;
    if (!(name in stored_images)) {
        mk_glyph(name, row & 1, row & 2, row & 4, row & 8, col & 1, col & 2, col & 4);
    }

    return getImage(name, size);
}