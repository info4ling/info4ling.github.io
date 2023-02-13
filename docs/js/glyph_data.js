'use strict';

var glyph_data = {};
var stored_images = {};
const IMG_W = 40;
const IMG_H = 40;
const IMG_SZ = (IMG_W + IMG_H) / 2;

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
    var what = arr.shift();
    var sub = arr.shift();

    if (!(what in glyph_data)) {
        glyph_data[what] = {};
    }
    if (!(sub in glyph_data[what])) {
        glyph_data[what][sub] = [];
    }

    glyph_data[what][sub].push(arr);
}

function draw_glyph_line(context, points_list) {
    points_list.forEach(pts => {
        do_glyph_line(context, [...pts]);
    });
}

function do_scale(v, max_v, sz, w) {
    var min = w;
    var max = sz - (2*w);

    var ret = w + (v / max_v) * max;
    return Math.ceil(ret);
}

function do_glyph_line(context, points) {
    const X = 1;
    const Y = 0;
    const W = 4;
    const max_v = 2;

    context.fillStyle = '#000000';
    context.lineWidth = 4;
    context.lineCap = 'square';

    var start = points.shift();
    var spos = glyph_data['P'][start][0];
    context.moveTo(do_scale(spos[X], 2, IMG_W, W), do_scale(spos[Y], 2, IMG_H, W));

    points.forEach(pt => {
        let run = glyph_data['P'][pt][0];
        context.lineTo(do_scale(run[X], 2, IMG_W, W), do_scale(run[Y], 2, IMG_H, W));
    });

    context.stroke();
}

function draw_glyph_stroke(context, what, which) {
    if (what in glyph_data) {
        if (which in glyph_data[what]) {
            var data = glyph_data[what][which];

            draw_glyph_line(context, data);
        }
    }
}

function draw_glyph_row(context, row) {
    if (row == 0) {
        draw_glyph_stroke(context, 'R', '0');
    } else {
        if (row & 1) {
            draw_glyph_stroke(context, 'R', '1');
        }
        if (row & 2) {
            draw_glyph_stroke(context, 'R', '2');
        }
        if (row & 4) {
            draw_glyph_stroke(context, 'R', '4');
        }
        if (row & 8) {
            draw_glyph_stroke(context, 'R', '8');
        }
    }
}

function draw_glyph_col(context, col) {
    if (col == 0) {
        draw_glyph_stroke(context, 'C', '0');
    } else {
        if (col & 1) {
            draw_glyph_stroke(context, 'C', '1');
        }
        if (col & 2) {
            draw_glyph_stroke(context, 'C', '2');
        }
        if (col & 4) {
            draw_glyph_stroke(context, 'C', '4');
        }
    }
}

function mk_glyph(name, row, col) {
    var canvas = makeCanvas(IMG_W, IMG_H);
    var context = canvas.getContext('2d');

    draw_glyph_row(context, row);
    draw_glyph_col(context, col);

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

function getImage(name, rsz = IMG_SZ, tp='div') {
    var dataURI = stored_images[name];
    var image = document.createElement(tp);
    image.style.width = rsz+'px';
    image.style.height = rsz+'px';
    image.style.backgroundImage ="url("+dataURI+")";
    return image;
}

function col_hdr_glyph(col, size) {
    var name = 'C' + col;
    if (!(name in stored_images)) {
        var canvas = makeCanvas(IMG_W, IMG_H);
        var context = canvas.getContext('2d');

        draw_glyph_col(context, col);
        saveImage(canvas, name);
    }

    return getImage(name, size);
}

function row_hdr_glyph(row, size) {
    var name = 'R' + row;
    if (!(name in stored_images)) {
        var canvas = makeCanvas(IMG_W, IMG_H);
        var context = canvas.getContext('2d');

        draw_glyph_row(context, row);
        saveImage(canvas, name);
    }

    return getImage(name, size);
}

function cell_glyph(row, col, size) {
    var name = 'R' + row + 'C' + col;
    if (!(name in stored_images)) {
        mk_glyph(name, row, col);
    }

    return getImage(name, size);
}

function cache_glyphs() {
    var showdiv = document.getElementById('allglyphs');

    for (var rh = 0; rh < 16; ++rh) {
        var image = row_hdr_glyph(rh, IMG_W / 2);
        showdiv.appendChild(image);
    }

    for (var ch = 0; ch < 8; ++ch) {
        var image = col_hdr_glyph(ch, IMG_W / 2);
        showdiv.appendChild(image);
    }

    for (var r = 0; r < 16; ++r) {
        for (var c = 0; c < 8; ++c) {
            var image = cell_glyph(r, c, IMG_W / 2);
            showdiv.appendChild(image);
        }
    }

    showdiv.style.display = 'none';
}