
//////////////////////// Globals


const BOOL = [false, true];

const spaces = ' &nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp';

const skip = [[], spaces];

const IMG_W = 40;
const IMG_H = 40;

const PAD_SZ = (IMG_W + IMG_H) / 10;

const SB = [[100, 60], [100, 90], [100, 80], [60, 70], [40, 50], [100, 30], [60, 20], [80, 8]];

const stored_images = {};

// Globals that change

var valc = 0;
var count_in_glyphs_row = 0;

// Globals set after document.ready()

var input = null;
var calc_glyph = null;
var calc_math = null;
var calc_lit = null;

//////////////////////////////// Functions





/*
function get_ctext(row, col, is_data = true) {
    if (col >= ctext.length) {
        return spaces;
    }
    if (is_data) {
        var number_col = ctext[col][0];
        if (row >= number_col.length) {
            return spaces;
        }
        return number_col[row]
    }
    return ctext[col][1];
}

function get_mtext(row, col, is_data = true) {
    if (col >= mtext.length) {
        return spaces;
    }
    if (is_data) {
        if (col == 0) {
            return mtext[row][0];
        }
        var number_row = mtext[row];
        col += 3;
        if (col >= number_col.length) {
            return spaces;
        }
        var ret = number_row[col];
        if (ret == '') {
            return spaces;
        }
        return ret;
    }
    return mtext[row][2];
}

function get_sl_text(which, row, col) {
    if (row == 0) { // top header
        if (col >= creature_types[which]) {
            return spaces;
        }
        return creature_types[which][col - 1];
    }
    row--;
    if (row >= lockeys.length) {
        return spaces;
    }
    var key = lockeys[row];
    if (col == 0) { // left header
        return key;
    }
    col--;
    var data = creatures[key][which];
    if (col >= data.length) {
        return spaces;
    }
    return data[col];
}

function get_live_text(row, col) {
    return wrap(get_sl_text(0, row, col));
}

function get_spirit_text(row, col) {
    return wrap(get_sl_text(1, row, col));
}

function num_sound(row) {
    var ret = row_sounds[row][0] + col_sounds[number_col][0];
    return ret;
}

function create_color(row, col) {
    var H = 0;
    var S = 0;
    var B = 0;
    var adj = 0;
    if (row == 0) { // Greyscale
        B = (7 - col) * 100 / 7;
    } else {
        if (row > 6) {
            adj = 15;
        }
        H = adj + ((row - 1) * 360 / 18);
        S = SB[col][0];
        B = SB[col][1];
    }
    return `hsl(${H} ${S}% ${B}%)`;
}

function color_circle(row, col) {
    var circle = document.createElement('div');
    circle.style.borderRadius = '50% 5% 50%'; // elliptical
    circle.style.backgroundColor = create_color(row, col);
    circle.style.border = '5px ridge grey';
    force_size(circle, IMG_H, IMG_W);
    circle.style.minHeight = IMG_H + 'px';
    circle.style.minWidth = IMG_W + 'px';
    circle.style.maxHeight = IMG_H + 'px';
    circle.style.maxWidth = IMG_W + 'px';
    circle.margin = 'auto';
    return circle;
}


function mk_layer(nm) {
    var img = mk_img(nm);
    img.style.position = 'absolute';
    img.style.left = 0;
    img.style.top = 0;
    img.style.width = '100%';
    img.style.height = '100%';

    //   img.style.width = IMG_W + 'px';
    //   img.style.height = IMG_H + 'px';
    return img;
}

function force_size(node, img_h, img_w) {
    node.style.minHeight = img_h + 'px';
    node.style.minWidth = img_w + 'px';
    node.style.maxHeight = img_h + 'px';
    node.style.maxWidth = img_w + 'px';
}

function mk_overlay(hdr, r8, r4, r2, r1, c4, c2, c1, padding = true, img_h = IMG_H, img_w = IMG_W, pad_sz = PAD_SZ) {
    var img = [];
    if (!hdr) {
        img.push(Xcore.cloneNode());
    }
    if (r8) {
        img.push(Xr8.cloneNode());
    }
    if (r4) {
        img.push(Xr4.cloneNode());
    }
    if (r2) {
        img.push(Xr2.cloneNode());
    }
    if (r1) {
        img.push(Xr1.cloneNode());
    }
    if (c4) {
        img.push(Xc4.cloneNode());
    }
    if (c2) {
        img.push(Xc2.cloneNode());
    }
    if (c1) {
        img.push(Xc1.cloneNode());
    }
    inner_div = mk_div(img);
    force_size(inner_div, img_h, img_w);

    mid_div = mk_div([inner_div]);
    mid_div.style.position = 'relative';
    force_size(mid_div, img_h, img_w);

    outer_div = mk_div([mid_div]);
    force_size(outer_div, img_h, img_w);

    if (padding) {
        outer_div.style.padding = pad_sz + 'px';
    }
    outer_div.style.border = '1px solid #808080';

    return outer_div;
}



function show_count_big() {
    var maxc = 36;
    var idiv = 2.5;
    var pdiv = 4;

    var counter = document.getElementById('count_body');

    return show_count(counter, maxc, idiv, pdiv);
}

function show_count_small(counter) {
    var maxc = 18;
    var idiv = 4;
    var pdiv = 7;

    return show_count(counter, maxc, idiv, pdiv);
}

function show_count(counter, maxc, idiv, pdiv) {
    var count_images = [];
    for (var cnt = 1; cnt < maxc; ++cnt) {
        var count_glyph = document.createElement('div');
        count_glyph.classList.add('glyph');
        valc++;
        var tooltip = valc.toString();
        tooltip += ' ' + do_calc(valc, count_glyph, null, null, IMG_H / idiv, IMG_W / idiv, PAD_SZ / pdiv);
        count_glyph.title = tooltip;
        count_images.push(count_glyph);
    }
    counter.appendChild(mk_row('td', count_images));
}

function count_more() {
    var counter = document.getElementById('count_body2');

    var rowc = count_in_glyphs_row;
    count_in_glyphs_row += 10;
    while (rowc < count_in_glyphs_row) {
        show_count_small(counter);
        ++rowc;
    }
    // var butn = document.getElementById('count_more');
    // butn.style.dsplay = 'none';
}

function mk_img(img) {
    var elem = document.createElement("img");
    elem.src = img;
    return elem;
}

function wrap(text) {
    var span = document.createElement("span");
    span.innerHTML = text;
    return span;
}

function br() {
    return wrap('<br>');
}

function attr(x, text) {
    return wrap('<' + x + '>' + text + '</' + x + '>');
}

function italic(text) {
    return attr('i', text);
}

function bold(text) {
    return attr('b', text);
}

function mk_span(items) {
    return mk_container("span", items);
}

function mk_div(items) {
    return mk_container("div", items);
}

function mk_container(container, items) {
    var box = document.createElement(container);
    items.forEach(i => {
        box.appendChild(i);
    });
    return box;
}

function cp(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function mk_row(tp, item) {
    var row = document.createElement('tr');
    item.forEach(i => {
        var cell = document.createElement(tp);
        cell.append(i);
        row.append(cell);
    });
    return row;
}

function getnum_txt(row) {
    var txt = get_ctext(row + 1, number_col, true);
    return txt;
}

function getnum(row) {
    var num = getnum_txt(row);
    var numval = Number(num.replace(/[*,]/g, ''));
    return numval;
}

function ismult(row) {
    var num = getnum_txt(row);
    return num.includes('*');
}

function setup_pronoun() {
    Array.from("iuoprxqnfm").forEach(c => {
        var div_name = "pro_" + c;
        var divo = document.getElementById(div_name);
        if (divo) {
            divo.appendChild(mk_pronoun(c));
        }
    });
}

function pronoun_row(what) {
    var prow = 0;

    switch (what) {
        case 'i':
            prow = 1;
            break;
        case 'u':
            prow = 2;
            break;
        case 'o':
            prow = 3;
            break;
        case 'p':
            prow = 4;
            break;
        case 'r':
            prow = 5;
            break;
        case 'x':
            prow = 6;
            break;
        case 'q':
            prow = 7;
            break;
        case 'n':
            prow = 8;
            break;
        case 'f':
            prow = 9;
            break;
        case 'm':
            prow = 10;
            break;
    }

    return prow;
}

function mk_pronoun(what, prow = pronoun_row(what)) {
    // 'Self' i, 'You' u, 'Other' o, 'Possessive' p, 'Reflexive' r, 'Plural' x, 'Unknown' q 'Neuter' n, 'Feminine' f, 'Masculine' m
    return mk_overlay(false, prow & 8, prow & 4, prow & 2, prow & 1, pronoun_col & 4, pronoun_col & 2, pronoun_col & 1, true, IMG_H / 3, IMG_W / 3, PAD_SZ / 4);
}

function prosound(what, prow = pronoun_row(what)) {
    var ret = row_sounds[prow][0] + col_sounds[pronoun_col][0];
    return ret;
}

function mk_numglyph(row, cond, h, w, p) {
    if (cond) {
        return mk_overlay(false, row & 8, row & 4, row & 2, row & 1, number_col & 4, number_col & 2, number_col & 1, true, h, w, p);
    }
    return null;
}

function convertnum(val, ret) {
    if (val == 0) {
        return ret;
    }

    for (var c = number_digits; c > 0; --c) {
        var n = getnum(c);
        var x = n;
        var p = 0;
        var skip = false;
        if (ismult(c)) {
            p = Math.floor(val / n);
            x = n * p;
            if (p == 0) {
                skip = true;
            }
        } else if (n > val) {
            skip = true;
        }
        if (skip) {
            continue;
        }
        var rec = [p, c];
        ret.push(rec);
        val -= x;
    }

    return ret;
}

function calc() {
    const val_raw = input.value;
    const val_strip = val_raw.replace(/[,*]/g, ''); // remove all ,
    const val = Number(val_strip); // convert to number

    do_calc(val, calc_glyph, calc_math, calc_lit);
}
function do_calc(val, glyph = null, math = null, lit = null, h = IMG_H, w = IMG_W, p = PAD_SZ) {
    if (glyph != null) {
        glyph.innerHTML = '';
    }

    if (math != null) {
        math.innerHTML = '';
    }

    if (lit != null) {
        lit.innerHTML = '';
    }

    if (isNaN(val)) {
        lit.innerText = 'Please Enter a Valid Number';
        return '';
    }

    var lsep = '';
    var mtext = '[' + val.toString(6) + '] ';
    var ltext = '';
    var alt = '';
    var msep = '';
    var msep_after = msep_after_pos;
    var seq = null;

    if (val <= 0) {
        seq = cp(zero_seq); // copy so zero_seq doesn't get modified
        if (val <= n_inf_val) {
            seq = n_inf_seq;
            alt = 'Too Low';
        } else if (val == 0) {
            alt = 'Zero';
        } else {
            seq = convertnum(-1 * val, seq); // val is negative, copy seq so it
            msep = '-';
            msep_after = msep_after_neg;
        }
    } else if (val >= inf_val) {
        seq = inf_seq;
        alt = 'Too High';
    } else {
        seq = convertnum(val, []);
    }

    for (var x = 0; x < seq.length; x++) {
        var rec = seq[x];

        var prowA = 0;
        var prowB = rec[0];

        var pvalA = 0;
        var pvalB = 0;

        var nrow = rec[1];
        var nval = getnum(nrow);

        if (prowB > 0) { // using a multiplier
            if (prowB > 6) { // it's on the second hand
                prowA = 5 + Math.floor(prowB / 6);
                pvalA = getnum(prowA);
                prowB -= pvalA;
            }
            pvalB = getnum(prowB);
        }

        args = [glyph != null, h, w, p];

        var nlit = num_sound(nrow);
        var nobj = mk_numglyph(nrow, ...args);
        if (msep == '-') { // negative
            mtext += msep;
            msep = '';
        } else {
            mtext += msep + nval;
            msep = msep_after;
        }

        ltext += lsep + nlit;
        lsep = lsep_after;

        if (glyph != null) {
            glyph.appendChild(nobj);
        }
        if (pvalA > 0) {
            var plitA = num_sound(prowA);
            var pobjA = mk_numglyph(prowA, ...args);
            if (pvalB > 0) {
                var plitB = num_sound(prowB);
                var pobjB = mk_numglyph(prowB, ...args);
                mtext += ' * (' + pvalA + msep_after_pos + pvalB + ')';
                ltext += lsep_after + plitA + lsep_after + plitB;

                if (glyph != null) {
                    glyph.appendChild(pobjA);
                    glyph.appendChild(pobjB);
                }
            } else {
                mtext += ' * ' + pvalA;
                ltext += lsep_after + plitA;
                if (glyph != null) {
                    glyph.appendChild(pobjA);
                }
            }
        } else if (pvalB > 0) {
            var plitB = num_sound(prowB);
            var pobjB = mk_numglyph(prowB, ...args);
            mtext += ' * ' + pvalB;
            ltext += lsep_after + plitB;
            if (glyph != null) {
                glyph.appendChild(pobjB);
            }
        }
    }
    if (math != null) {
        if (alt == '') {
            math.innerText = mtext;
        } else {
            math.innerText = alt;
        }
    }
    if (lit != null) {
        lit.innerText = ltext;
    }

    return ltext;
}

function rbvalue(name) {
    var selector = 'input[name="' + name + '"]:checked';
    var qs = document.querySelector(selector);
    if (qs) return qs.value;
    return null;
}

function cbchecked(name) {
    var cb = document.getElementById(name);
    if (cb && cb.checked) return 1;
    return 0;
}

function put_pronoun(glist, ltext, what) {
    var prow = pronoun_row(what);
    glist.push(mk_pronoun(what, prow));
    ltext[0] += prosound(what, prow);
}

function do_pronoun(glist, ltext, etext, gender, plural, gen_txt) {
    if (plural) {
        put_pronoun(glist, ltext, 'x');
        // gentext set for plural
    }

    put_pronoun(glist, ltext, gender);
    etext[0] += gen_txt;
}

function handle_pronoun(glist, ltext, etext, txt, pre, esep) {
    switch (txt) {
        case pre + '0':
            return esep;
        case pre + 'F': // Plural
            do_pronoun(glist, ltext, etext, 'f', true, 'fff');
            esep = ' ';
            break;
        case pre + 'f':
            do_pronoun(glist, ltext, etext, 'f', false, 'f');
            esep = ' ';
            break;
        case pre + 'M': // Plural
            do_pronoun(glist, ltext, etext, 'm', true, 'mmm');
            esep = ' ';
            break;
        case pre + 'm':
            do_pronoun(glist, ltext, etext, 'm', false, 'm');
            esep = ' ';
            break;
        case pre + 'N': // Plural
            do_pronoun(glist, ltext, etext, 'n', true, 'nnn');
            esep = ' ';
            break;
        case pre + 'n':
            do_pronoun(glist, ltext, etext, 'n', false, 'n');
            esep = ' ';
            break;
        case pre + 'Q':
            do_pronoun(glist, ltext, etext, 'q', true, '???');
            esep = ' ';
            break;
        case pre + 'q':
            do_pronoun(glist, ltext, etext, 'q', false, '?');
            esep = ' ';
            break;
    }
    return ' ';
}

function handle_sub_pronoun(glist, ltext, etext, val, sing, plur, esep) {
    if (val == 0) return esep;

    var txt = (val == 1) ? sing : plur;
    return handle_pronoun(glist, ltext, etext, txt, '', esep);
}

function procalc() {
    var text = document.getElementById("pro-eng");
    text.innerHTML = '';
    var lit = document.getElementById("pro-lit");
    lit.innerHTML = '';
    var pglyph = document.getElementById("pro-glyph");
    pglyph.innerHTML = '';
    var self = rbvalue("icb");
    var person = rbvalue("person");
    var xf = cbchecked("f") + cbchecked("f2");
    var xm = cbchecked("m") + cbchecked("m2");
    var xn = cbchecked("n") + cbchecked("n2");
    var xq = cbchecked("q") + cbchecked("q2");

    glist = [];
    ltext = [''];
    etext = [''];
    esep = '';

    var has_self = cbchecked('me');

    if (has_self) {
        put_pronoun(glist, ltext, 'i');
        etext[0] += 'I(';
        esep = handle_pronoun(glist, ltext, etext, self, 'i', esep);
        etext[0] += ')';
    }

    if (person == '1') {
        if (!has_self) {
            etext[0] = "You must select something...";
        } else {
            document.getElementById('f').checked = false;
            document.getElementById('f2').checked = false;
            document.getElementById('m').checked = false;
            document.getElementById('m2').checked = false;
            document.getElementById('n').checked = false;
            document.getElementById('n2').checked = false;
            document.getElementById('q').checked = false;
            document.getElementById('q2').checked = false;
        }
    } else {
        if (xf + xm + xn + xq == 0) {
            var none = document.getElementById('p1');
            none.checked = true;
            etext[0] = "You must select something...";
        } else {
            // Set for 'Other'
            var mix_plural = (xf + xm == 4);
            var need_other = true;
            var pre = 'o';
            var txt = 'Other';
            if (person == '2') { // you
                need_other = false;
                pre = 'u';
                txt = 'You';
                put_pronoun(glist, ltext, 'u'); // always need you
            } else if (!has_self) {
                need_other = false;
            } if (mix_plural) {
                need_other = true;
            }

            if (need_other) {
                put_pronoun(glist, ltext, 'o');
            }

            if (xq == 2) { // special case -- unkown plural overrides
                put_pronoun(glist, ltext, 'x');
                etext[0] += txt + '(unknown plural)'
            } else if (mix_plural) {  // special case -- other/you implies mixed plural
                etext[0] += txt + '(plural)';
            } else if (xq == 1) { // special case -- single unknown covers all other singles
                etext[0] += txt + '(';
                var plus = '';
                if (xf == 2) {
                    esep = handle_sub_pronoun(glist, ltext, etext, xf, 'f', 'F', esep);
                    plus = '+';
                }
                if (xm == 2) {
                    esep = handle_sub_pronoun(glist, ltext, etext, xm, 'm', 'M', esep);
                    plus = '+';
                }
                if (xn == 2) {
                    esep = handle_sub_pronoun(glist, ltext, etext, xn, 'n', 'N', esep);
                    plus = '+';
                }
                put_pronoun(glist, ltext, 'q');
                etext[0] += plus + 'unknown single)'
            } else {
                etext[0] += txt + '(';
                esep = handle_sub_pronoun(glist, ltext, etext, xf, 'f', 'F', esep);
                esep = handle_sub_pronoun(glist, ltext, etext, xm, 'm', 'M', esep);
                esep = handle_sub_pronoun(glist, ltext, etext, xn, 'n', 'N', esep);
                etext[0] += ')';
            }
        }
    }

    if (glist.length > 0) {
        pglyph.appendChild(mk_div(glist));
    }
    lit.innerHTML = ltext[0];
    text.innerHTML = etext[0];
}

document.addEventListener('DOMContentLoaded', function () {
    input = document.getElementById('number');
    calc_glyph = document.getElementById('glyph');
    calc_math = document.getElementById('math');
    calc_lit = document.getElementById('lit');

    numtxt = document.getElementById('number_txt');
    numtxt.innerHTML = number_txt;
    numtxt.style.border = '2px solid black';
    numtxt.style.marginBottom = '25px';

    protxt = document.getElementById('pron_txt');
    protxt.innerHTML = pron_txt;
    protxt.style.border = '2px solid black';
    protxt.style.marginBottom = '25px';
    var arr = csv_to_arr_of_arr("glyph_data.csv", function () {
        load_glyph_data(arr);

        var cbody = document.getElementById("cbody");
        var chead = document.getElementById("chead");
        var blank = wrap('');
        var all = [];
        var row = 0;
        var header = false;
        var hdr_images = [blank];
        var ftr_images = [wrap('Comments:')];
        BOOL.forEach(r8 => {
            BOOL.forEach(r4 => {
                BOOL.forEach(r2 => {
                    BOOL.forEach(r1 => {
                        var col = 0;
                        var images = [ // left header
                            mk_div([
                                mk_overlay(true, r8, r4, r2, r1, false, false, false),
                                mk_div([
                                    bold(row_sounds[row][0]),
                                    wrap(' '),
                                    italic(row_sounds[row][1]),
                                ]),
                                mk_div([bold(get_mtext(row, 0))]),
                                get_live_text(row + 1, 0), // get_spirit_text(row + 1, 0), SKIP (live and spirit have the same text)
                            ])
                        ];
                        BOOL.forEach(c4 => {
                            BOOL.forEach(c2 => {
                                BOOL.forEach(c1 => {
                                    if (!header) {
                                        hdr_images.push(mk_div([ // top header
                                            mk_overlay(true, false, false, false, false, c4, c2, c1),
                                            bold(get_ctext(0, col)),
                                            bold(col_sounds[col][0]),
                                            italic(col_sounds[col][1]),
                                            get_live_text(0, col + 1),
                                            get_spirit_text(0, col + 1),
                                        ]));
                                        ftr_images.push(mk_div([ // double div to control overflow
                                            mk_div([
                                                wrap(get_ctext(0, col, false)),
                                            ]),
                                        ]));
                                    }
                                    images.push(mk_div([ // each cell
                                        mk_overlay(false, r8, r4, r2, r1, c4, c2, c1),
                                        color_circle(row, col),
                                        italic(row_sounds[row][0] + col_sounds[col][0]),
                                        bold(get_ctext(row + 1, col) + spaces),
                                        mk_div([bold(get_mtext(row, col + 1))]), // css sets colspan=2 -- wrap(spaces),
                                        get_live_text(row + 1, col + 1), get_spirit_text(row + 1, col + 1),
                                    ]));
                                    col++;
                                }); // c1
                            }); // c2
                        }); // c4
                        if (!header) {
                            header = true;
                            chead.appendChild(mk_row('th', hdr_images));
                        }
                        cbody.appendChild(mk_row('td', images));
                        row++;
                    }); // r1
                }); // r2
            }); // r4
        }); // r8
        cbody.appendChild(mk_row('td', ftr_images));
    }
    var counter = document.getElementById('count_body2');

    show_count_big();
    for (rowc = 1; rowc < 5; ++rowc) {
        show_count_small(counter);
    }
    count_in_glyphs_row = 5;

    setup_pronoun();
});

*/