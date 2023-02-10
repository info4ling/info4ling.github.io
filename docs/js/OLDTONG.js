'use strict';
//////////////////////// Globals

const BOOL = [false, true];

const spaces = ' &nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp';

const skip = [[], spaces];

const PAD_SZ = (IMG_W + IMG_H) / 10;

const SB = [[100, 60], [100, 90], [100, 80], [60, 70], [40, 50], [100, 30], [60, 20], [80, 8]];

// Globals that change

var valc = 0;
var count_in_glyphs_row = 0;

// Globals set after document.ready()

var input = null;
var calc_glyph = null;
var calc_math = null;
var calc_lit = null;

var locations = []; // H
var meaning = [];
var prof = []; // M
var prof_opp = []; // M
var legend = []; // L
var creature = {}; // D
var creature_type = []; // D

var sounds = {};

var numbers = [];
var preps = [];
var verbs = [];

var data = {
    'locations': locations,
    'meaning': meaning,
    'prof': prof,
    'prof_opp': prof_opp,
    'legend': legend,
    'creature': creature,
    'creature_type': creature_type,
    'sounds': sounds,
    'numbers': numbers,
    'preps': preps,
    'verbs': verbs,
    'glyph_data': glyph_data,
    'stored_images': stored_images,
};
//////////////////////////////// Functions

function handle_blobs(values) {
    console.log('GOT:', values, data);

    setTimeout(() => {
        cache_glyphs();
    }, 0);
    
    setTimeout(() => {
        mk_main_table();
    }, 100);
}

function load_gdata(skip, line) {
    var row = comma_split(line);
    set_glyph_data(row);
}

function load_gsound(skip, line) {
    var row = comma_split(line);

    // WHAT, lit, say, example
    var what = row[0];
    var lit = row[1];
    var say = row[2];
    if (say == '') {
        say = lit;
    }
    var example = row[3];

    var data = [lit, say, example];

    if (!(what in sounds)) {
        sounds[what] = [];
    }
    sounds[what].push(data);
}

function load_cols(skip, line) {
    var row = comma_split(line);

    var dest;
    var is_header;
    var is_comment;
    var multirow;

    switch (row[0]) {
        case 'H':
            dest = locations;
            is_header = false;
            is_comment = false;
            multirow = false;
            break;
        case 'C':
            dest = meaning;
            is_header = true;
            is_comment = true;
            multirow = true;
            break;
        case 'M':
            if (row[4] == 'Profession') {
                dest = prof;
            } else {
                dest = prof_opp;
            }
            is_header = false;
            is_comment = false;
            multirow = false;
            break;
        case 'L':
            dest = legend;
            is_header = true;
            is_comment = false;
            multirow = true;
            break;
        case 'D':
            var type = row[3];
            is_header = true;
            is_comment = false;
            multirow = true;
            if (!(type in creature)) {
                creature[type] = [];
                creature_type.push(type);
            }
            dest = creature[type];
            break;
        default:
            return;
    }

    var base = 5;
    var max_row = 16;
    var header = is_header ? 1 : 0;
    var comment = is_comment ? 1 : 0;

    var start = base - header;
    var last = start + max_row + header + comment;
    do_add(dest, row, start, last, multirow);
}


function load_rows(skip, line) {
    var row = comma_split(line);

    var start;
    var dest;
    var extra;
    switch (row[0]) {
        case 'NUMBER':
            start = 3;
            extra = 1; // Comment
            dest = numbers;
            break;
        case 'PREPOSITION':
            start = 4;
            extra = 0;
            dest = preps;
            break;
        case 'JOB':     // verbs and magic powerwords are based on jobs
            start = 1;
            extra = 3; // Name, Create/Destroy, Comment
            dest = verbs;
            break;
        default:
            return;
    }
    var max_row = 8;
    var last = start + extra + max_row;
    do_add(dest, row, start, last, true);
}

const empty = '';

function do_add(dest, row, start, last, is_multirow) {
    var add;
    if (is_multirow) {
        add = [];
        dest.push(add);
    } else {
        add = dest;
    }
    for (var c = start; c < last; c++) {
        if (c < row.length) {
            add.push(row[c]);
        } else {
            add.push(empty);
        }
    }
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
        S = SB[col-1][0];
        B = SB[col-1][1];
    }
    return `hsl(${H} ${S}% ${B}%)`;
}

function force_size(node, img_h, img_w) {
    node.style.minHeight = img_h + 'px';
    node.style.minWidth = img_w + 'px';
    node.style.maxHeight = img_h + 'px';
    node.style.maxWidth = img_w + 'px';
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
    circle.style.margin = 'auto';
    return circle;
}

/*
                          /VOWEL\|[lit]<say>| c:type  | [c.subtype.1][c.subtype.2]
                          \ ''  /|[as in]   |   ''    | [c.subtype.3][c.subtype.4]
                          legend |meaning   |   ''    | [c.subtype.5][c.subtype.6]
                             ''  |   ''     |   ''    | [c.subtype.7][c.subtype.8]
 

 / CONS \|[lit]<say>      /GLYPH\ |[lit]<say>|[number]| [     c1    ][    c2     ]
 \  ''  /|[as in]         \ ''  / |meaning   |[prep]  | [     c3    ][    c4     ]
 [loc]                    [legend]|   ''     |/COLOR\ | [     c5    ][    c6     ]
 [job]                    [verb]  |   ''     |\  '' / | [     c7    ][    c8     ]
*/

/* WRONG


function mk_cell(row, col) {
    var glyph = cell_glyph(row, IMG_SZ);
    var lit = cell_lit(row);
    var say = cell_say(row);
    var color = color_circle(row, col);
    var num = cell_num(row, col);
}

*/

function mk_subcell(arr, cl, item, is_glyph, rows=1, cols=1) {
    let ret = [item, rows, cols, is_glyph, cl];
    arr.push(ret);
}

function mk_subtext_say(arr, cl, what, row, col, rows=1, cols=1, font='') {
    var lit='';
    var say='';

    if (what == 'row' || what == 'cell') {
        var srows = sounds['C'][row-1];
        lit = srows[0];
        say = srows[1];
    }

    if (what == 'col' || what == 'cell') {
        var scols = sounds['V'][col-1];
        lit += scols[0];
        say += scols[1];
    }

    var txt = lit + '(' + say + ')'; // will be a button
    return mk_subtxt(arr, cl, txt, rows, cols, font);
}
function base_class(list) {
    var ret = list[0];
    if (ret == 'CR' && list[1] != 'C0') {
            ret = list[1];
    }
    return ret;
}

function mk_subtxt(arr, cl, raw_txt, rows=1, cols=1, font='') {
    var item;
    var tooltip = '';
    var txt = '';
    if (raw_txt == '') {
        txt = '{<i>' + base_class(cl) + '</i>}';
    } else {
        let vals = raw_txt.split(/\*/);
        
        if (vals.length > 1) {
            txt = '<b>'+vals[0] + '</b> *';
            tooltip = vals[1];
        } else {
            txt = raw_txt;
        }
    }
    switch (font) {
        case 'b':
            item = bold(txt);
            break;
        case 'i':
            item = italic(txt);
            break;
        default:
            item = wrap(txt);
    }
    if (tooltip != '') {
        item.setAttribute('title', tooltip);
    }
    return mk_subcell(arr, cl, item, null, rows, cols);
}

function mk_glyph_entry(arr, other_cl, row, col, r = 1, c = 1) {
    var label = '';
    var sound = '';
    if (row > 0) {
        label += 'R' + (row - 1);
        sound+=sounds['C'][row - 1][1];
    }
    if (col > 0) {
        label += 'C' + (col - 1);
        sound+=sounds['V'][col - 1][1];
    }
        
    mk_subcell(arr, ['GLYPH', ...other_cl] , label, sound, r, c);
}

function add_subcell(arr, items) {
    if (items.length) {
        arr.push(...items);
    }
}

function creature_subtype(subtype, cnum, where) { // where is 0 for subtype label
    return subtype[cnum-1][where];
}

const row_max = 18; // 16 + hdr + comment
const row_for_comment = row_max - 1;

const col_max = 10; // 8 + hdr + comment
const col_for_comment = col_max - 1;

var num_list = [];

function mk_main_table() {
    var tbl = document.getElementById('ctable');
    var tbl_display = tbl.style.display;
    tbl.style.display = 'none';
    var hdr = document.getElementById('chead');
    var body = document.getElementById('cbody');

    var row_comment = '';
    var row_hdr = 'R';
    var html_tp = 'th';
    var obj = hdr;
    var alt = 'ODDROW';
    var row_class = alt;
    for (let row = 0; row < row_max; ++row) {
        if (alt == 'ODDROW') {
            alt = 'EVENROW';
        } else {
            alt = 'ODDROW';
        }
        row_class = alt;

        if (row == row_for_comment) {
            row_comment = '*';
        }
        var xx = [];
        var aa = [];
        var bb = [];
        var cc = [];
        var dd = [];
        var col_comment = '';
        var col_hdr = 'C';
        for (let col = 0; col < col_max; col++) { // 8 + hdr + comment
            var ctype;
            var csubtp;
            if (col == col_for_comment) {
                col_comment = '+';
            } else {
                ctype = creature_type[col-1];
                csubtp = creature[ctype];
            }

            var code = row_hdr + col_hdr + row_comment + col_comment;
            var x = [];
            var a = [];
            var b = [];
            var c = [];
            var d = [];

            switch (code) {
                case 'RC': // Upper Left
                    mk_subtxt(x, ['CORNER', 'BLANK'], '', 5, 2); // 4x2 of nothing
                    break;
                case 'Rc+': // TOP ROW HEADER - Comment
                    mk_subtxt(x, ['COMMENT', 'BT3', 'BB3', 'BL3', 'BR3'], 'Comment', 5, 1, 'b');    // row column
                    break;
                case 'Rc': // TOP ROW HEADER
                    row_class = 'HDR';
                    // line 0
                    mk_subtxt(x, ['BLANK'], '', 1, 3);                                              // 0, 1 blank
                    mk_subtxt(x, ['CR', 'C0', 'BT3', 'BL3', 'BR3'], ctype, 1, 2, 'b');                    // 0, 2 Creature type

                    // line 1
                    mk_glyph_entry(a, ['BT3', 'BB2', 'BL3', 'BR1'], row, col, 2);                                 // 1,1 RIGHT HALF OF GLYPH
                    mk_subtext_say(a, ['LIT', 'BT3', 'BB1', 'BR2'], 'col', 0, col, 1, 1, 'b');                      // 1, 2 LIT<say>
                    mk_subtxt(a, ['NUM', 'BT3', 'BB1'], 'Number', 1, 1, 'bi');                                      // 1, 3 Number Label
                    mk_subtxt(a, ['CR', 'C1', 'BT2', 'BB1', 'BL2', 'BR1'], creature_subtype(csubtp, 1, 0), 1, 1, 'b');    // 1, 4 C1 - SUBTYPE
                    mk_subtxt(a, ['CR', 'C2', 'BT2', 'BB1', 'BR3'],creature_subtype(csubtp, 2, 0), 1, 1, 'b');            // 1, 5 C2 - SUBTYPE

                    // line 2
                                                                                                                    // 2, 1 2nd GLYPH
                    mk_subtxt(b, ['ASIN', 'BB2', 'BR2'], sounds['V'][col - 1][2], 1, 1, 'b');                       // 2, 2 as in
                    mk_subtxt(b, ['PREP', 'BB1'], 'Preposition', 1, 1, 'bi');                                       // 2, 3 Preposition Label
                    mk_subtxt(b, ['CR', 'C3', 'BB1', 'BL2', 'BR1'], creature_subtype(csubtp, 3, 0), 1, 1, 'b');           // 2, 4 C3 - SUBTYPE
                    mk_subtxt(b, ['CR', 'C4', 'BB1', 'BR3'], creature_subtype(csubtp, 4, 0), 1, 1, 'b');                  // 2, 5 C4 - SUBTYPE

                    // line 3
                    mk_subtxt(c, ['LEGEND', 'BB1', 'BL3', 'BR1'],  legend[col - 1][0], 1, 1, 'b');                  // 3, 1 legend
                    mk_subtxt(c, ['MEANING', 'BB3', 'BR1'], meaning[col - 1][0], 2, 1, 'b');                        // 3, 2 Meaning
                    mk_subtxt(c, ['COLOR', 'BB3'], 'Color', 2, 1, 'bi');                                            // 3, 3 Color Label
                    mk_subtxt(c, ['CR', 'C5', 'BB1', 'BL2', 'BR1'], creature_subtype(csubtp, 5, 0), 1, 1, 'b');           // 3, 4 C5 - SUBTYPE
                    mk_subtxt(c, ['CR', 'C6', 'BB1', 'BR3'], creature_subtype(csubtp, 6, 0), 1, 1, 'b');                  // 3, 5 C6 - SUBTYPE

                    // line 4
                    mk_subtxt(d, ['VERB', 'BB3', 'BL3', 'BR1'], 'Verb', 1, 1, 'bi');                                // 4, 1 'verb' label
                                                                                                                    // 4, 2 2nd Meaning
                                                                                                                    // 4, 3 2nd COLOR
                    mk_subtxt(d, ['CR', 'C7', 'BB3', 'BL2', 'BR1'], creature_subtype(csubtp, 7, 0), 1, 1, 'b');           // 4, 4 C7 - SUBTYPE
                    mk_subtxt(d, ['CR', 'C8', 'BB3', 'BR3'], creature_subtype(csubtp, 8, 0), 1, 1, 'b');                  // 4, 5 C8 - SUBTYPE
                    break;
                case 'rC*': // FIRST COL HEADER - Comment
                    mk_subtxt(a, ['COMMENT', 'BT3', 'BB3', 'BL3', 'BR3'], 'Comment', 1, 2, 'bi');       // comment column
                    break;
                case 'rC': // FIRST COL HEADER
                    // line 1
                    mk_glyph_entry(a, ['HDR', 'BT3', 'BB2', 'BL3', 'BR1'], row, col, 2);             // 1, 1 LEFT HALF OF  GLYPH
                    mk_subtext_say(a, ['LIT', 'HDR', 'BT3', 'BB1', 'BR3'], 'row', row, 0, 1, 1, 'b');   // 1, 2 LIT<say>

                    // line 2
                                                                                                        // 2, 1 2nd GLYPH
                    mk_subtxt(b, ['ASIN', 'HDR', 'BB2', 'BR3'], sounds['C'][row-1][2], 1, 1, 'b');      // 2, 2 as in

                    // line 3
                    mk_subtxt(c, ['LOC', 'HDR', 'BB1', 'BL3', 'BR3'], locations[row-1], 1, 2, 'b');     // 3, 1 Location
                                                                                                        // 3, 2 2nd Location
                    // line 4
                    mk_subtxt(d, ['VERB', 'HDR', 'BB3', 'BL3', 'BR3'], verbs[row - 1][0], 1, 2, 'b');   // 4, 1 job/verb/powerword
                                                                                                        // 4, 2 2nd job/verb/powerword
                    break;
                case 'rc*': // CELL
                    mk_subtxt(a, ['COMMENT', 'BB3', 'BL3', 'BR3'], 'Comment', 1, 5, 'bi');              // comment column
                    break;
                case 'rc+': // CELL
                    mk_subtxt(a, ['COMMENT', 'BT3', 'BB3', 'BR3'], 'Comment', 4, 1, 'bi');              // comment row
                    break;
                case 'rc': // CELL
                    var num = numbers[row - 1][col];
                    var nvals = [num, row - 1, col - 1];
                    num_list.push(nvals);

                    // line 1
                    mk_glyph_entry(a, ['BB2', 'BR1'], row, col, 2);  // 1, 1 FULL GLYPH
                    mk_subtext_say(a, ['LIT', 'BB2', 'BR2'], 'cell', row, col, 2);                  // 1, 2 LIT<say>
                    mk_subtxt(a, ['NUM', 'BB1'], num);                                              // 1, 3 Number
                    mk_subtxt(a, ['CR', 'C1', 'BB1', 'BL2', 'BR1'], creature_subtype(csubtp, 1, row));    // 1, 4 C1 - SUBTYPE
                    mk_subtxt(a, ['CR', 'C2', 'BB1', 'BR3'], creature_subtype(csubtp, 2, row));           // 1, 5 C2 - SUBTYPE

                    // line 2                   
                                                                                                    // 2, 1 2nd GLYPH
                                                                                                    // 2, 2 2nd LIT
                    mk_subtxt(b, ['PREP', 'BB1'], preps[row - 1][col - 1]);                         // 2, 3 preposition
                    mk_subtxt(b, ['CR', 'C3', 'BB1', 'BL2', 'BR1'], creature_subtype(csubtp, 3, row));    // 2, 4 C3 - SUBTYPE
                    mk_subtxt(b, ['CR', 'C4', 'BB1', 'BR3'], creature_subtype(csubtp, 4, row));           // 2, 5 C4 - SUBTYPE

                    // line 3
                    mk_subtxt(c, ['CR', 'LEGEND', 'BB1', 'BR1'], legend[col - 1][row]);                   // 3, 1 legend
                    mk_subtxt(c, ['CR', 'MEANING', 'BB3', 'BR1'], meaning[col - 1][row], 2);              // 3, 2 meaning
                    mk_subcell(c, ['CR', 'COLOR', 'BB3', 'BR1'], color_circle(row, col), null, 2);       // 3, 3 color
                    mk_subtxt(c, ['CR', 'C5', 'BB1', 'BL2', 'BR1'], creature_subtype(csubtp, 5, row));    // 3, 4 C5 - SUBTYPE
                    mk_subtxt(c, ['CR', 'C6', 'BB1', 'BR3'], creature_subtype(csubtp, 6, row));           // 3, 4 C6 - SUBTYPE

                    // line 4 
                    mk_subtxt(d, ['VERB', 'BB3', 'BR1'], verbs[row - 1][col + 2]);                  // 4, 1 job/verb/powerword
                                                                                                    // 4, 2 2nd Meaning
                                                                                                    // 4, 3 2nd COLOR
                    mk_subtxt(d, ['CR', 'C7', 'BB3', 'BL2', 'BR1'], creature_subtype(csubtp, 7, row));    // 4, 4 C7 - SUBTYPE
                    mk_subtxt(d, ['CR', 'C8', 'BB3', 'BR3'], creature_subtype(csubtp, 8, row));           // 4, 5 C8 - SUBTYPE
                    break;
            }
            add_subcell(xx, x);
            add_subcell(aa, a);
            add_subcell(bb, b);
            add_subcell(cc, c);
            add_subcell(dd, d);
            col_hdr = 'c';
        }
        if (xx.length != 0) {
            obj.appendChild(mk_row(html_tp, xx, row_class));
        }
        obj.appendChild(mk_row(html_tp, aa, row_class));
        obj.appendChild(mk_row(html_tp, bb, row_class));
        obj.appendChild(mk_row(html_tp, cc, row_class));
        obj.appendChild(mk_row(html_tp, dd, row_class));
        row_hdr = 'r';
        html_tp = 'td';
        obj = body;
    }
    tbl.style.display = tbl_display;
    return;
}

on_ready_blobs([
    ['data/datacols.csv', 'cols', load_cols],
    ['data/datarows.csv', 'rows', load_rows],
    ['data/glyph_data.csv', 'gdata', load_gdata],
    ['data/glyph_sound.csv', 'gsound', load_gsound],
//    ['badfile.csv', 'bf', simple_csv_to_arr_of_arr], // TEST BAD FILE
], handle_blobs);

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

var hue_filter = {
    ASIN: 40,
    LIT: 40,
    PREP: 80,
    LOC: 120,
    LEGEND: 120,
    MEANING: 160,
    VERB: 200,
    GLYPH: 240,
    C0: 270,
    C1: 280,
    C2: 290,
    C3: 300,
    C4: 310,
    C5: 320,
    C6: 330,
    C7: 340,
    C8: 350
};

var bright_filter = {
    HDR: 75,
    EVENROW: 80,
}

function mk_row(tp, item_list, row_class) {
    var row = document.createElement('tr');

    item_list.forEach(i => {
        var item = i[0];
        var rows = i[1];
        var cols = i[2];
        var glyph_sound = i[3];
        var cl = i[4];
        var cell = document.createElement(tp);

        var attr = {};
        attr[row_class] = 1;
        cl.forEach(cls => {
            attr[cls] = 1;
        });

        var is_header = false;
        var bright_val = 100;
        if ('HDR' in attr) {
            is_header = true;
            bright_val = bright_filter['HDR'];
        }

        var hue_val = 0;
        var attr_keys = Object.keys(attr);
        let is_blank = 'CORNER' in attr;
        cell.classList.add(...attr_keys);
        if (glyph_sound == null && !is_blank) {
            cell.classList.add('GCELL');
        }

        if (!('COLOR' in attr)) {
            attr_keys.forEach(att => {
                if (bright_val == 100) {
                    if (att in bright_filter) {
                        bright_val = bright_filter[att];
                    }
                }
                if (att in hue_filter) {
                    hue_val = hue_filter[att];
                }
            });

            cell.style.filter = 'brightness(' + bright_val + '%) hue-rotate(' + hue_val + 'deg)';
        }
       
        if (rows > 1) {
            cell.rowSpan = rows;
        }
        if (cols > 1) {
            cell.colSpan = cols;
        }

        cell.appendChild(gbutton(item, glyph_sound, is_header, cl));
        row.appendChild(cell);
    });
    return row;
}

function do_say(what) {
    alert(what);
}

const hide_cell = 'HIDECELL';

function gbutton(item, glyph_sound, is_hdr, cl) {
    var button = item;
    if (glyph_sound!=null) {
        button = getImage(item, IMG_SZ, 'button');
        button.onclick = function () {
            do_say(glyph_sound);
        };
        return button;
    } else if (!is_hdr) {
        return item;
    }

    button = document.createElement('button');
    button.appendChild(item);
    button.classList.add('GBUTTON', ...item.classList);
    let tgt = base_class(cl);

    var hide_class = 'GCELL';
    var show_class = tgt;

    button.onclick = function () {
        // Hide all Cells
        var hide = document.getElementsByClassName(hide_class);
        [...hide].forEach(elem => {
            elem.classList.add(hide_cell);
        });
        // Unhide the tgt Cells
        var list = document.getElementsByClassName(show_class);
        [...list].forEach(elem => {
            elem.classList.remove(hide_cell);
        });

        var tmp = hide_class;
        hide_class = show_class;
        show_class = tmp;
    };

    return button;
}

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

function cp(obj) {
    return JSON.parse(JSON.stringify(obj));
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