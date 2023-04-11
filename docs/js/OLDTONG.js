'use strict';
//////////////////////// Globals

const BOOL = [false, true];

const spaces = ' &nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp';

const SKIP = [[], spaces];
const PAD_SZ = (IMG_W + IMG_H) / 10;

const MAX_COLS = 5;

//color
const SB = [[0, 0, "Grey Scale"], [80, 50, "Full Color"], [70, 70, "Pale Color"], [60, 50, "Muted Color"], [50, 40, "Medium Color"], [40, 30, "Dim Color",], [60, 12, "Dark Color"], [100, 90, "Glowing"]];
// name, hue
var H_ROW_VALUE = [];
var H_ROW_LABEL = [];

// Globals that change
var valc = 0;
var count_in_glyphs_row = 0;

// Globals set after document.ready()

var input = null;
var calc_glyph = null;
var calc_math = null;
var calc_lit = null;
var voiceSelect = null;
var glyphtable = null;
var glyphchoices = null;

function set_element_globals_by_id() {
    input = document.getElementById('number');
    calc_glyph = document.getElementById('glyph');
    calc_math = document.getElementById('math');
    calc_lit = document.getElementById('lit');
    voiceSelect = document.getElementById('voiceSelect');
    glyphtable = document.getElementById('glyphtable');
    glyphtable = document.getElementById('glyphchoices');
}

var number_glyph = '';
var number_to_glyph = [];

var values = null;
var sounds = {};
var sound_fix = {};

function assert_value_grid() {
    if (values == null) {
        values = [];
        for (let row = 0; row < 16; row++) {
            let newrow = [];
            for (let col = 0; col < 8; col++) {
                let hash = {};
                hash.row = row;
                hash.col = col;

                newrow.push(hash);
            }
            values.push(newrow);
        }
    }
}

//////////////////////////////// Functions

function handle_blobs(rets) {
    console.log('GOT:', rets, values);

    setTimeout(() => {
        cache_glyphs();
    }
        , 0);

    setTimeout(() => {
        setup_screen();
    }
        , 100);
}

function load_gdata(SKIP, line) {
    var row = comma_split(line);
    set_glyph_data(row);
}

function load_gsound(SKIP, line) {
    var row = comma_split(line);

    // WHAT, lit, say, example
    var what = row[0];
    if (what == 'H') {
        return;
    }
    var lit = row[1];
    var say = row[2];
    if (say == '') {
        say = lit;
    }
    var example = row[3];

    var data = [lit, say, example];

    if (what == 'X') {
        sound_fix[lit] = say;
    } else {
        if (!(what in sounds)) {
            sounds[what] = [];
        }
        sounds[what].push(data);
    }
}

var HEADERS = [];
var LEFT_HEADER = [];
var MAP_HEADER = {};
var SHOW_HEADER = {};
var COMMENT = [];
var PREFIX = {};

const BASE = 'CORE';

function get_key(str) {
    let key = str.toLowerCase();
    let split = key.split(/\*/);
    if (split.length > 1) {
        key = split[0];
    }
    return key;
}

function load_cols(retval, line) {
    if (retval == null) {
        assert_value_grid();
        retval = ['', 0, ''];
    }

    let last = retval[0];
    let y = retval[1];
    let last2 = retval[2];

    var linedata = comma_split(line);
    if (linedata.length < 6) {
        return retval;
    }
    let cur = linedata[0];
    if (cur == last) {
        y++;
    } else {
        y = 0;
    }

    var which = linedata[2].toLowerCase();
    var type = linedata[3].toLowerCase();
    var subtype = linedata[4].toLowerCase();
    var hdr = subtype;
    let last_x = linedata.length;

    if (!(BASE in MAP_HEADER)) {
        MAP_HEADER[BASE] = [];
        HEADERS.push(BASE);
        LEFT_HEADER.push(BASE);
        SHOW_HEADER[BASE] = true;
    }

    switch (cur) {
        case 'WL':
            for (let x = 5; x < linedata.length; x++) {
                H_ROW_LABEL.push(linedata[x]);
            }
            break;
        case 'WN':
            for (let x = 5; x < linedata.length; x++) {
                H_ROW_VALUE.push(linedata[x]);
            }
            break;
        case 'C':
            let iscurr = (hdr == 'currency');
            let iscat = (hdr == 'category');
            let comment = '';
            
            if (last_x >= 5 + 16) {
                last_x = 5 + 16;
                comment = linedata[last_x];
            }
            COMMENT.push(comment);
            MAP_HEADER[BASE].push(hdr);
            
            for (let x = 5; x < last_x; x++) {
                let what = linedata[x];
                
                if (iscurr) {
                    what = mk_currency();
                } else if (iscat && what != '') {
                    PREFIX[get_key(what)] = [x - 5, y];
                }

                values[x-5][y][BASE] = what;
            }
            break;
        case 'V':
        case 'D':           
            if (type == '') {
                type = subtype;
            } else if (subtype == '') {
                subtype = type;
            }
            
            let left_hdr = which + '.' + type;

            if (left_hdr != last2) {
                last2 = left_hdr;
                y = 0;
                HEADERS.push(left_hdr);
                SHOW_HEADER[left_hdr] = true;
                let empty = [];
                MAP_HEADER[left_hdr] = empty;
            }

            hdr = left_hdr + '.' + subtype;
            MAP_HEADER[left_hdr].push(hdr);

            if (last_x >= 5 + 16) {
                last_x = 5 + 16;
            }
            let iscreature = (subtype == 'creature');
            
            for (let x = 5; x < last_x; x++) {
                let what = linedata[x];
                if (type == 'color') {
                    what = create_color(x - 5, y);
                } else if (iscreature) {
                    PREFIX['creature.' + get_key(what)]=[x - 5, y];
                }
                values[x - 5][y][left_hdr] = what;
            }
            break;
        default:
            return retval;
    }

    return [cur, y, last2];
}

function create_color(row, col) {
    var H = 0;
    var S = 0;
    var B = 0;

    if (col == 0) {
        // Greyscale
        B = row * 100 / 15;
    } else {
        H = H_ROW_VALUE[row];
        S = SB[col][0];
        B = SB[col][1];
    }
    return `hsl(${H} ${S}% ${B}%)`;
}

function force_size(node, img_h, img_w) {
    node.style.minHeight = img_h + 'px';
    node.style.minWidth = img_w + 'px';
    node.style.maxHeight = img_h + 'px';
    node.style.maxWidth = img_w + 'px';
}

function color_circle(hsl) {
   // return wrap(create_color(row, col));
    var circle = document.createElement('div');
    circle.style.borderRadius = '50% 5% 50%';
    // elliptical
    circle.style.backgroundColor = hsl;
    circle.style.border = '5px ridge grey';
    force_size(circle, IMG_H, IMG_W);
    circle.style.minHeight = IMG_H + 'px';
    circle.style.minWidth = IMG_W + 'px';
    circle.style.maxHeight = IMG_H + 'px';
    circle.style.maxWidth = IMG_W + 'px';
    circle.style.margin = 'auto';
    return circle;
}

const currency_coins = [1, 5, 12, 28];
const currency_all = 71;
const currency_repeat = currency_coins.length;
var currency_count = 0;
var coin_count = 0;
var currency_val = [];

function glyph_name(row, col, what = 'cell') {
    var lit = '';
    var say = '';

    if (what == 'row' || what == 'cell') {
        var srows = sounds['C'][row];
        lit = srows[0];
        say = srows[1];
    }

    if (what == 'col' || what == 'cell') {
        var scols = sounds['V'][col];
        lit += scols[0];
        say += scols[1];
    }

    return [lit, say];
}

/*
function mk_currency(row, col) {
    let curtext = '';
    let coin = currency_count % currency_repeat;
    let dobold = false;
    if (coin == 0) {
        currency_name.push(glyph_name(row, col)[0]);
        currency_val = currency_val.map(function (c) { return c * currency_all; }); // mult all by 5
        currency_val.push(1);
        dobold = true;
    }
    let currency_sep = '';
    let currency_mult = currency_coins[coin];
    for (let cx = currency_name.length - 1; cx >= 0; cx--) {
        if (dobold) {
            curtext += '<b>1 ' + currency_name[cx] + '</b><br>';
            dobold = false;
        } else {
            curtext += currency_sep + (currency_val[cx] * currency_mult) + ' ' + currency_name[cx];
        }
        currency_sep = ', ';
    }
    currency_count++;

    return curtext;
}
*/

function mk_currency() {
    let curtext = '';
    let coin = currency_count % currency_repeat;
    let dobold = false;
    if (coin == 0) {
        coin_count++;
        currency_val = currency_val.map(function (c) { return c * currency_all; }); // mult all by 5
        currency_val.push(1);
        dobold = true;
    }
    let currency_sep = '';
    let currency_mult = currency_coins[coin];
    for (let cx = coin_count - 1; cx >= 0; cx--) {
        if (dobold) {
            curtext += '<b>1 COIN' + cx + '</b><br>';
            dobold = false;
        } else {
            curtext += currency_sep + (currency_val[cx] * currency_mult) + ' COIN' + cx;
        }
        currency_sep = ', ';
    }
    currency_count++;

    return curtext;
}

var voice_lookup = {};

function setup_sound() {
    window.speechSynthesis.onvoiceschanged = function () {
        var voices = window.speechSynthesis.getVoices();

        for (let i = 0; i < voices.length; i++) {
            const option = document.createElement('option');
            var txt = `${voices[i].name} (${voices[i].lang})`;

            if (voices[i].default) {
                txt += ' — DEFAULT';
            }

            option.textContent = txt;
            voice_lookup[txt] = voices[i];
            option.setAttribute('data-lang', voices[i].lang);
            option.setAttribute('data-name', voices[i].name);
            voiceSelect.appendChild(option);
        }
    }
}

function setup_screen() {
    set_element_globals_by_id();
    setup_sound();
    setup_currency();  
    init_cell_choice();
    draw_glyph_table();
}

function setup_currency() {
    // mk_currency(row, col)
}

function init_cell_choice() {
    // create checkboxes
    // glyphchoices
}


function clear_div(div) {
    while (div.firstChild) {
        div.removeChild(div.firstChild);
    }
}

function add_tile(td, txt, tag, row, col) {
    let grid = document.createElement('div');
    grid.style.display = 'flex';
    grid.style.flexDirection = 'column';

    let glyphs = [];

    let hier = tag.split(/\./);
    let creature_glyph = PREFIX['creature'];
    switch (hier[0]) {
        case 'category':
            if (hier[1] in PREFIX) {
                glyphs.push(PREFIX[hier[1]]);
            }
            break;
        case 'creature':
            glyphs.push(creature_glyph);
            let which_name = hier[0] + '.' + hier[1];
            let which_creature = PREFIX[which_name];
            glyphs.push(which_creature);
            break;
    }

    let cur_glyph = [row, col];
    glyphs.push(cur_glyph);

    let glyph_text = '';
    let glyph_say = '';

    for (let g = 0; g < glyphs.length; g++) {
        let r = glyphs[g][0];
        let c = glyphs[g][1];
        let name = glyph_name(r, c);
        glyph_text += name[0];
        glyph_say += name[1];
    }

    let gtxt = glyph_text + ' (' + glyph_say + ')';
    let gdiv = document.createElement('div');
    let gspan = document.createElement('span');
    gspan.innerHTML = gtxt;
    gdiv.appendChild(gspan);
    grid.appendChild(gdiv);

    let vdiv = document.createElement('div');
    if (tag == 'category.color.color') {
        let cdiv = color_circle(txt);
        vdiv.appendChild(cdiv);
    } else {
        let vspan = document.createElement('span');
        vspan.innerHTML = txt;
        vdiv.appendChild(vspan);
    }
    grid.appendChild(vdiv);

    td.appendChild(grid);
}

function draw_glyph_table() {
    clear_div(glyphtable);
   
    let cur_hdr = [];
    for (let h = 0; h < HEADERS.length; h++) {
        let hdr = HEADERS[h];
        if (SHOW_HEADER[hdr]) {
            cur_hdr.push(hdr);
        }
    }

    if (cur_hdr.length == 0) {
        let span = document.createElement('span');
        span.innerHTML = 'Nothing Chosen';
        div.appendChild(span);
        return;
    }

    let thead = document.createElement('thead');
    let tbody = document.createElement('tbody');

    var max_cols = MAX_COLS;
    // empty_cols is how many cells are empty at the bottom
    let empty_cols = (max_cols - (cur_hdr.length % max_cols)) % max_cols;

    if (cur_hdr.length < max_cols) {
        max_cols = cur_hdr.length;
        empty_cols = 0;
    }

    for (let e = 0; e < empty_cols; ++e) {
        cur_hdr.push('EMPTY');
    }

    let top_blank = [];
    let top_cells = [[], [], [], [], [], [], [], []];

    for (let h = 0; h < cur_hdr.length; h++) {
        let tb = document.createElement('th');
        top_blank.push(tb);
        let hval = cur_hdr[h];
        for (let col = 0; col < 8; col++) {
            let th = document.createElement('th');
            let hspan = document.createElement('span');
            let tag = hval;
            if (hval in MAP_HEADER && MAP_HEADER[hval].length > col) {
                tag = MAP_HEADER[hval][col];
            }
            let tagparts = tag.split(/\./);
            if (tagparts.length > 1) {
                if (tagparts.lenght == 2) {
                    tag = tagparts[1];
                } else if (tagparts[1] == tagparts[2]) {
                    tag = tagparts[2];
                } else {
                    tag = tagparts[1] + ':' + tagparts[2];
                }
            }
            hspan.innerHTML = tag;
            th.appendChild(hspan);
            top_cells[col].push(th);
        }
        if ((h + 1) % max_cols == 0) {
            let tr = document.createElement('tr');
            for (let b = 0; b < top_blank.length; b++) {
                tr.appendChild(top_blank[b]);
            }
            for (let ch = 0; ch < top_cells.length; ch++) {
                for (let hv = 0; hv < top_cells[ch].length; hv++) {
                    tr.appendChild(top_cells[ch][hv]);
                }
            }
            thead.appendChild(tr);
            top_blank = [];
            top_cells = [[], [], [], [], [], [], [], []];
        }
    }

    for (let row = 0; row < 16; row++) {
        let hdrs = [];
        let cells = [[],[],[],[],[],[],[],[]];
        for (let h = 0; h < cur_hdr.length; h++) {
            let th = document.createElement('th');
            let hspan = document.createElement('span');
            let hval = cur_hdr[h];
            hspan.innerHTML = hval;
            th.appendChild(hspan);
            hdrs.push(th);
            for (let col = 0; col < 8; col++) {
                let td = document.createElement('td');
                
                let tag = hval;
                if (hval in MAP_HEADER && MAP_HEADER[hval].length > col) {
                    tag = MAP_HEADER[hval][col];
                }
                let txt = '';
                if (hval in values[row][col]) {
                    txt = values[row][col][hval];
                }
                if (txt == '') {
                    txt = '{' + tag + '}';
                    let dspan = document.createElement('span');
                    dspan.innerHTML = txt;
                    td.appendChild(dspan);
                } else {
                    add_tile(td, txt, tag, row, col);
                }
                   
                cells[col].push(td);
            }
            if ((h+1) % max_cols == 0) {
                let tr = document.createElement('tr');
                for (let hh = 0; hh < hdrs.length; hh++) {
                    tr.appendChild(hdrs[hh]);
                }
                for (let cc = 0; cc < cells.length; cc++) {
                    for (let cv = 0; cv < cells[cc].length; cv++) {
                        tr.appendChild(cells[cc][cv]);
                    }
                }
                tbody.appendChild(tr);
                hdrs = [];
                cells = [[], [], [], [], [], [], [], []];
            }
        }
    }
    let table = document.createElement('table');
    table.appendChild(thead);
    table.appendChild(tbody);
    glyphtable.appendChild(table);
}

/*
function mk_subcell(arr, cl, item, rows = 1, cols = 1) {
    let ret = [item, rows, cols, cl];
    arr.push(ret);
}

function glyph_name(row, col, what = 'cell') {
    var lit = '';
    var say = '';

    if (what == 'row' || what == 'cell') {
        var srows = sounds['C'][row - 1];
        lit = srows[0];
        say = srows[1];
    }

    if (what == 'col' || what == 'cell') {
        var scols = sounds['V'][col - 1];
        lit += scols[0];
        say += scols[1];
    }

    return [lit, say];
}

function mk_subtext_say(arr, cl, what, row, col, rows = 1, cols = 1, font = '') {
    var txt = glyph_name(row, col, what, true)
    // will be a button
    return mk_subtxt(arr, cl, txt, rows, cols, font);
}
function base_class(list) {
    var ret = list[0];
    if (ret == 'CR' && list[1] != 'C0') {
        ret = list[1];
    }
    return ret;
}

function mk_subtxt(arr, cl, raw_txt, rows = 1, cols = 1, font = '') {
    var item;
    var tooltip = '';
    var txt = '';
    if (raw_txt == null) {
        txt = '';
        // cl.join('-');
    } else if (raw_txt == '') {
        var bc = base_class(cl);
        if (bc != 'CX') {
            txt = '{<i>' + bc + '</i>}';
        }
    } else {
        
        let vals = raw_txt.replace(/(?<!<\s*)\//g, '/<wbr>').split(/\*./);

        if (vals.length > 1) {
            txt = '<b>' + vals[0] + '</b> *';
            tooltip = vals[1];
        } else {
            txt = vals[0];
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

    return mk_subcell(arr, [...cl, 'GCELL'], item, rows, cols);
}

function mk_hidden_glyph(arr, class_name, more, row, col, depth = 2, do_prepend = false) {
    mk_glyph_entry(arr, [class_name, 'GLYPH', 'HIDECELL', 'GROUPHIDE', 'GCELL', ...more], row, col, depth, 1, do_prepend ? class_to_row_column(class_name) : '');
}

function mk_glyph_entry(arr, cl, row, col, r = 1, c = 1, extra = '') {
    var glyph_rec = [row - 1, col - 1];
    if (extra != '') {
        glyph_rec = [extra, glyph_rec];
    }

    mk_subcell(arr, cl, glyph_rec, r, c);
}

function add_subcell(arr, items) {
    if (items.length) {
        arr.push(...items);
    }
}

function creature_subtype(subtype, cnum, where) {
    // where is 0 for subtype label
    return creature[subtype][cnum - 1][where];
}

const row_max = 18;
// 16 + hdr + comment
const row_for_comment = row_max - 1;

const col_max = 10;
// 8 + hdr + comment
const col_for_comment = col_max - 1;

var num_list = [];



function setup_screen() {

        ;

    var tbl = document.getElementById('ctable');
    var tbl_display = tbl.style.display;
    tbl.style.display = 'none';
    var hdr = document.getElementById('chead');
    var body = document.getElementById('cbody');

    var currency_count = 0;
    var currency_name = [];
    var currency_val = [];

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
        var ee = [];

        var col_comment = '';
        var col_hdr = 'C';
        for (let col = 0; col < col_max; col++) {
            // 8 + hdr + comment
            var ctype;
            var csubtp;
            if (col == col_for_comment) {
                col_comment = '+';
            } else {
                ctype = creature_type[col - 1];
                csubtp = creature[ctype];
            }

            var code = row_hdr + col_hdr + row_comment + col_comment;
            var x = [];
            var a = [];
            var b = [];
            var c = [];
            var d = [];
            var e = [];

            switch (code) {
                case 'RC':

                    var toprow = document.createElement('tr');
                    var blankcell = show_hline(obj, ['BLANK'], 5);
                    var hlinecell = show_hline(obj, ['HLINE'], 43);
                    toprow.appendChild(blankcell);
                    toprow.appendChild(hlinecell);
                    obj.appendChild(toprow);

                    // Upper Left -- needs to be blank, but collapse, so create each element but blank

                    show_vline(a, ['BLANK', 'LIT', 'NUM', 'PREP']);
                    mk_subtxt(a, ['BLANK', 'HIDECELL', 'GROUPHIDE'], null, 2);
                    mk_subtxt(a, ['BLANK', 'LIT', 'NUM', 'PREP'], null, 2);
                    // 1,1 RIGHT HALF OF GLYPH
                    mk_subtxt(a, ['LIT', 'BLANK'], null, 2);
                    // 1, 2 LIT<say>
                    mk_subtxt(a, ['NUM', 'BLANK'], null, 2);
                    // 1, 3 Number Label
                    mk_subtxt(a, ['PREP', 'BLANK'], null, 2);
                    // 1, 3 Number Label

                    // line 2
                    show_vline(c, ['BLANK', 'LOC', 'MEANING', 'VERB', 'COLOR']);
                    mk_subtxt(c, ['BLANK', 'GLYPH', 'HIDECELL', 'GROUPHIDE', 'LOC', 'MEANING', 'VERB', 'COLOR'], null, 2);
                    mk_subtxt(c, ['MEANING', 'BLANK'], null, 2);
                    // 3, 2 Meaning
                    mk_subtxt(c, ['VERB', 'BLANK'], null, 2);
                    // 4, 1 'verb' label
                    mk_subtxt(c, ['LOC', 'BLANK'], null, 2);
                    // 3, 1 legend
                    mk_subtxt(c, ['COLOR', 'BLANK'], null, 2);
                    // 3, 3 Color Label

                    // line X
                    show_vline(x, ['BLANK', 'CR']);
                    mk_subtxt(x, ['BLANK', 'CR'], null, 1, 4);
                    // 0, 2 Creature type 
                    mk_subtxt(x, ['CR', 'C0', 'BLANK', 'HIDECELL', 'GROUPHIDE'], null, 1);

                    // line 3
                    show_vline(d, ['BLANK', 'CR', 'C1', 'C2', 'C3', 'C4']);
                    mk_subtxt(d, ['BLANK', 'GLYPH', 'HIDECELL', 'GROUPHIDE', 'CR', 'C1', 'C2', 'C3', 'C4'], null, 2);
                    mk_subtxt(d, ['CR', 'C1', 'BLANK'], null, 2);
                    // 1, 4 C1 - SUBTYPE
                    mk_subtxt(d, ['CR', 'C2', 'BLANK'], null, 2);
                    // 1, 5 C2 - SUBTYPE
                    mk_subtxt(d, ['CR', 'C3', 'BLANK'], null, 2);
                    // 2, 4 C3 - SUBTYPE
                    mk_subtxt(d, ['CR', 'C4', 'BLANK'], null, 2);
                    // 2, 5 - SUBTYPE

                    // line 3.5
                    show_vline(e, ['BLANK', 'CR', 'C5', 'C6', 'C7', 'C8']);
                    mk_subtxt(e, ['BLANK', 'GLYPH', 'HIDECELL', 'GROUPHIDE', 'CR', 'C5', 'C6', 'C7', 'C8'], null, 2);
                    mk_subtxt(e, ['CR', 'C5', 'BLANK'], null, 2);
                    // 3, 4 C5 - SUBTYPE
                    mk_subtxt(e, ['CR', 'C6', 'BLANK'], null, 2);
                    // 3, 5 C6 - SUBTYPE
                    mk_subtxt(e, ['CR', 'C7', 'BLANK'], null, 2);
                    // 4, 4 C7 - SUBTYPE
                    mk_subtxt(e, ['CR', 'C8', 'BLANK'], null, 2);
                    // 4, 5 C8 - SUBTYPE

                    break;
                case 'Rc+':
                    // TOP ROW HEADER - Comment
                    mk_subtxt(a, ['NUM', 'COMMENT', 'WIDE'], 'NUMBER COMMENT', 2, 1, 'bi');
                    mk_subtxt(c, ['VERB', 'COMMENT', 'WIDE'], 'VERB COMMENT', 2, 1, 'bi');
                    mk_subtxt(x, ['COMMENT', 'WIDE'], ' ', 2, 1, 'bi');
                    mk_subtxt(d, ['COMMENT', 'WIDE'], ' ', 2, 1, 'bi');
                    mk_subtxt(e, ['COMMENT', 'WIDE'], ' ', 2, 1, 'bi');
                    break;
                case 'Rc':
                    // TOP ROW HEADER
                    row_class = 'HDR';

                    // line 1
                    mk_glyph_entry(a, ['GLYPH', 'GCELL', 'LIT', 'HDR'], row, col, 2);
                    mk_hidden_glyph(a, 'NUM', [], row, col);
                    mk_hidden_glyph(a, 'PREP', [], row, col);
                    mk_subtext_say(a, ['LIT'], 'col', 0, col, 1, 1, 'b');
                    // 1, 2 LIT<say>
                    mk_subtxt(a, ['NUM'], 'Number', 2, 1, 'bi');
                    // 1, 3 Number Label
                    mk_subtxt(a, ['PREP'], 'Preposition', 2, 1, 'bi');
                    // 1, 3 Number Label

                    // line 1.5
                    // 2, 1 2nd GLYPH
                    mk_subtxt(b, ['LIT'], sounds['V'][col - 1][2], 1, 1, 'b');
                    // 2, 2 as in

                    // line 2 
                    mk_hidden_glyph(c, 'LOC', [], row, col);
                    mk_hidden_glyph(c, 'MEANING', [], row, col);
                    mk_hidden_glyph(c, 'VERB', [], row, col);
                    mk_hidden_glyph(c, 'COLOR', [], row, col);
                    mk_subtxt(c, ['MEANING'], meaning[col - 1][0], 2, 1, 'b');
                    // 3, 2 Meaning
                    mk_subtxt(c, ['VERB'], 'Verb', 2, 1, 'bi');
                    // 4, 1 'verb' label
                    mk_subtxt(c, ['LOC'], legend[col - 1][0], 2, 1, 'b');
                    // 3, 1 legend
                    mk_subtxt(c, ['COLOR'], SB[col - 1][2], 2, 1, 'bi');
                    // 3, 3 Color Label

                    // line X

                    mk_hidden_glyph(x, 'CR', [], row, col, 8);
                    mk_subtxt(x, ['CR', 'C0'], 'CREATURE', 2, 4, 'b');
                    // 0, 2 Creature type                                                                                                // 4, 2 2nd Meaning

                    // line 3
                    mk_hidden_glyph(d, 'C1', [], row, col);
                    mk_hidden_glyph(d, 'C2', [], row, col);
                    mk_hidden_glyph(d, 'C3', [], row, col);
                    mk_hidden_glyph(d, 'C4', [], row, col);
                    mk_subtxt(d, ['CR', 'C1'], creature_type[0] + ': ' + creature_subtype(creature_type[0], col, 0), 2, 1, 'b');
                    // 1, 4 C1 - SUBTYPE
                    mk_subtxt(d, ['CR', 'C2'], creature_type[1] + ': ' + creature_subtype(creature_type[1], col, 0), 2, 1, 'b');
                    // 1, 5 C2 - SUBTYPE
                    mk_subtxt(d, ['CR', 'C3'], creature_type[2] + ': ' + creature_subtype(creature_type[2], col, 0), 2, 1, 'b');
                    // 2, 4 C3 - SUBTYPE
                    mk_subtxt(d, ['CR', 'C4'], creature_type[3] + ': ' + creature_subtype(creature_type[3], col, 0), 2, 1, 'b');
                    // 2, 5 - SUBTYPE

                    // line 3.5
                    mk_hidden_glyph(e, 'C5', [], row, col);
                    mk_hidden_glyph(e, 'C6', [], row, col);
                    mk_hidden_glyph(e, 'C7', [], row, col);
                    mk_hidden_glyph(e, 'C8', [], row, col);
                    mk_subtxt(e, ['CR', 'C5'], creature_type[4] + ': ' + creature_subtype(creature_type[4], col, 0), 2, 1, 'b');
                    // 3, 4 C5 - SUBTYPE
                    mk_subtxt(e, ['CR', 'C6'], creature_type[5] + ': ' + creature_subtype(creature_type[5], col, 0), 2, 1, 'b');
                    // 3, 5 C6 - SUBTYPE
                    mk_subtxt(e, ['CR', 'C7'], creature_type[6] + ': ' + creature_subtype(creature_type[6], col, 0), 2, 1, 'b');
                    // 4, 4 C7 - SUBTYPE
                    mk_subtxt(e, ['CR', 'C8'], creature_type[7] + ': ' + creature_subtype(creature_type[7], col, 0), 2, 1, 'b');
                    // 4, 5 C8 - SUBTYPE

                    break;
                case 'rC*':
                    // FIRST COL HEADER - Comment
                    show_vline(a, ['MEANING']);
                    mk_subtxt(a, ['MEANING', 'HDR'], 'Comment', 1, 4, 'bi');
                    // comment column
                    mk_subtxt(a, ['MEANING', 'HIDECELL', 'GROUPHIDE', 'HDR'], 'Comment', 1, 2, 'bi');
                    // comment column
                    break;
                case 'rC':
                    // FIRST COL HEADER
                    // line 1
                    show_vline(a, ['LIT', 'NUM', 'PREP']);
                    mk_glyph_entry(a, ['GLYPH', 'GCELL', 'LIT', 'HDR'], row, col, 2);
                    // 1, 1 LEFT HALF OF  GLYPH
                    mk_hidden_glyph(a, 'NUM', [], row, col);
                    mk_hidden_glyph(a, 'PREP', [], row, col);
                    mk_subtext_say(a, ['LIT', 'HDR'], 'row', row, 0, 1, 1, 'b');
                    // 1, 2 LIT<say>
                    mk_subtxt(a, ['NUM', 'HDR'], 'Number', 2, 1, 'bi');
                    // 1, 3 Number
                    mk_subtxt(a, ['PREP', 'HDR'], 'Preposition', 2, 1, 'bi');
                    // 2, 3 preposition                   

                    // line 1.5
                    // 2, 1 2nd GLYPH
                    mk_subtxt(b, ['LIT', 'HDR'], sounds['C'][row - 1][2], 1, 1, 'b');
                    // 2, 2 as in

                    // line 2
                    show_vline(c, ['LOC', 'MEANING', 'VERB', 'COLOR']);
                    mk_hidden_glyph(c, 'LOC', [], row, col);
                    mk_hidden_glyph(c, 'MEANING', [], row, col);
                    mk_hidden_glyph(c, 'VERB', [], row, col);
                    mk_hidden_glyph(c, 'COLOR', [], row, col)
                    mk_subtxt(c, ['MEANING', 'HDR'], 'Meaning', 2, 1, 'bi');
                    // 3, 2 meaning
                    mk_subtxt(c, ['VERB', 'HDR'], verbs[row - 1][0], 2, 1, 'b');
                    // 4, 1 job/verb/powerword
                    mk_subtxt(c, ['LOC', 'HDR'], locations[row - 1], 2, 1, 'b');
                    // 3, 1 Location
                    mk_subtxt(c, ['COLOR', 'HDR'], H_ROW[row-1][1], 2, 1, 'bi');

                    // line 3
                    show_vline(d, ['CR', 'C1', 'C2', 'C3', 'C4']);
                    mk_hidden_glyph(d, 'CR', [], row, col, 4);
                    mk_hidden_glyph(d, 'C1', [], row, col);
                    mk_hidden_glyph(d, 'C2', [], row, col);
                    mk_hidden_glyph(d, 'C3', [], row, col);
                    mk_hidden_glyph(d, 'C4', [], row, col);
                    mk_subtxt(d, ['C1', 'CR', 'HDR'], creature_type[0], 2);
                    mk_subtxt(d, ['C2', 'CR', 'HDR'], creature_type[1], 2);
                    mk_subtxt(d, ['C3', 'CR', 'HDR'], creature_type[2], 2);
                    mk_subtxt(d, ['C4', 'CR', 'HDR'], creature_type[3], 2);

                    // line 3.5
                    show_vline(e, ['CR', 'C5', 'C6', 'C7', 'C8']);
                    mk_hidden_glyph(e, 'C5', [], row, col);
                    mk_hidden_glyph(e, 'C6', [], row, col);
                    mk_hidden_glyph(e, 'C7', [], row, col);
                    mk_hidden_glyph(e, 'C8', [], row, col);
                    mk_subtxt(e, ['C5', 'CR', 'HDR'], creature_type[4], 2);
                    mk_subtxt(e, ['C6', 'CR', 'HDR'], creature_type[5], 2);
                    mk_subtxt(e, ['C7', 'CR', 'HDR'], creature_type[6], 2);
                    mk_subtxt(e, ['C8', 'CR', 'HDR'], creature_type[7], 2);
                    break;
                case 'rc*':
                    // CELL
                    mk_subtxt(a, ['MEANING'], meaning[col - 1][row], 2, 4, 'bi');
                    // comment column
                    mk_subtxt(a, ['MEANING', 'HIDECELL', 'GROUPHIDE'], meaning[col - 1][row], 2, 2, 'bi');
                    // comment column
                    break;
                case 'rc+':
                    // CELL
                    mk_subtxt(a, ['NUM', 'COMMENT', 'WIDE'], numbers[row - 1][0], 2, 1, 'bi');
                    // comment row
                    mk_subtxt(c, ['VERB', 'COMMENT', 'WIDE'], verbs[row - 1][2], 2, 1, 'bi');
                    // comment row
                    mk_subtxt(d, ['COMMENT', 'WIDE'], ' ', 2, 1, 'bi');
                    mk_subtxt(e, ['COMMENT', 'WIDE'], ' ', 2, 1, 'bi');
                    // comment row
                    break;
                case 'rc':
                    // CELL
                    var num = numbers[row - 1][col];
                    if (!Number.isNaN(num)) {
                        var nvals = [num, row - 1, col - 1];
                        num_list.push(nvals);
                    }

                    // line 1
                    mk_glyph_entry(a, ['GLYPH', 'GCELL', 'LIT'], row, col, 2);
                    // 1, 1 LEFT HALF OF  GLYPH
                    mk_hidden_glyph(a, 'NUM', [], row, col, 2, true);
                    mk_hidden_glyph(a, 'PREP', [], row, col, 2, true);
                    mk_subtext_say(a, ['LIT'], 'cell', row, col, 2);
                    // 1, 2 LIT<say>
                    mk_subtxt(a, ['NUM'], num, 2, 1, 'b');
                    // 1, 3 Number
                    mk_subtxt(a, ['PREP'], preps[row - 1][col - 1], 2);
                    // 2, 3 preposition

                    // line 1.5 -- Nothing

                    // line 2
                    mk_hidden_glyph(c, 'LOC', [], row, col, 2, true);
                    mk_hidden_glyph(c, 'MEANING', [], row, col, 2, true);
                    mk_hidden_glyph(c, 'VERB', [], row, col, 2, true);
                    mk_hidden_glyph(c, 'COLOR', [], row, col, 2, true)
                    let meaning_txt = meaning[col - 1][row];

                    const currency_coins = [1, 5, 12, 28];
                    const currency_all = 71;
                    const currency_repeat = currency_coins.length;

                    if (col == 2) { //currency
                        let coin = currency_count % currency_repeat;
                        let dobold = false;
                        if (coin == 0) {
                            currency_name.push(glyph_name(row, col));
                            currency_val = currency_val.map(function (c) { return c * currency_all; }); // mult all by 5
                            currency_val.push(1);
                            dobold = true;
                        }
                        let currency_sep = '';
                        let currency_mult = currency_coins[coin];
                        for (let cx = currency_name.length - 1; cx >= 0; cx--) {
                            if (dobold) {
                                meaning_txt += '<b>1 ' + currency_name[cx] + '</b><br>';
                                dobold = false;
                            } else {
                                meaning_txt += currency_sep + (currency_val[cx] * currency_mult) + ' ' + currency_name[cx];                               
                            }
                            currency_sep = ', ';
                        }
                        currency_count++;
                    }
                    mk_subtxt(c, ['MEANING'], meaning_txt, 2);
                    // 3, 2 meaning
                    mk_subtxt(c, ['VERB'], verbs[row - 1][col + 2], 2);
                    // 4, 1 job/verb/powerword
                    mk_subtxt(c, ['LOC'], legend[col - 1][row], 2);
                    // 3, 1 legend
                    mk_subcell(c, ['COLOR', 'GCELL'], color_circle(row, col), 2);
                    // 3, 3 color

                    // line 3
                    mk_hidden_glyph(d, 'CR', [], row, col, 4);
                    mk_hidden_glyph(d, 'C1', [], row, col, 2, true);
                    mk_hidden_glyph(d, 'C2', [], row, col, 2, true);
                    mk_hidden_glyph(d, 'C3', [], row, col, 2, true);
                    mk_hidden_glyph(d, 'C4', [], row, col, 2, true);
                    mk_subtxt(d, ['CR', 'C1'], creature_subtype(creature_type[0], col, row), 2);
                    // 1, 4 C1 - SUBTYPE
                    mk_subtxt(d, ['CR', 'C2'], creature_subtype(creature_type[1], col, row), 2);
                    // 1, 5 C2 - SUBTYPE
                    mk_subtxt(d, ['CR', 'C3'], creature_subtype(creature_type[2], col, row), 2);
                    // 2, 4 C3 - SUBTYPE
                    mk_subtxt(d, ['CR', 'C4'], creature_subtype(creature_type[3], col, row), 2);
                    // 2, 5 C4 - SUBTYPE

                    // line 3.5
                    mk_hidden_glyph(e, 'C5', [], row, col, 2, true);
                    mk_hidden_glyph(e, 'C6', [], row, col, 2, true);
                    mk_hidden_glyph(e, 'C7', [], row, col, 2, true);
                    mk_hidden_glyph(e, 'C8', [], row, col, 2, true);
                    mk_subtxt(e, ['CR', 'C5'], creature_subtype(creature_type[4], col, row), 2);
                    // 3, 4 C5 - SUBTYPE
                    mk_subtxt(e, ['CR', 'C6'], creature_subtype(creature_type[5], col, row), 2);
                    // 3, 4 C6 - SUBTYPE
                    mk_subtxt(e, ['CR', 'C7'], creature_subtype(creature_type[6], col, row), 2);
                    // 4, 4 C7 - SUBTYPE
                    mk_subtxt(e, ['CR', 'C8'], creature_subtype(creature_type[7], col, row), 2);
                    // 4, 5 C8 - SUBTYPE
                    break;
            }
            mk_vline(x, ['CR']);
            mk_vline(a, ['LIT', 'HDR', 'NUM', 'PREP']);
            mk_vline(c, ['MEANING', 'VERB', 'LOC', 'COLOR']);
            mk_vline(d, ['CR', 'C1', 'C2', 'C3', 'C4']);
            mk_vline(e, ['CR', 'C5', 'C6', 'C7', 'C8']);
            add_subcell(xx, x);
            add_subcell(aa, a);
            add_subcell(bb, b);
            add_subcell(cc, c);
            add_subcell(dd, d);
            add_subcell(ee, e);
            col_hdr = 'c';
        }
        add_row(aa, obj, html_tp, row_class);
        add_row(bb, obj, html_tp, row_class);
        add_row(cc, obj, html_tp, row_class);
        add_row([], obj, null, row_class);
        add_row(xx, obj, html_tp, row_class);
        add_row([], obj, null, row_class);
        add_row(dd, obj, html_tp, row_class);
        add_row([], obj, null, row_class);
        add_row(ee, obj, html_tp, row_class);
        add_row([], obj, null, row_class);
        mk_hline(obj);

        row_hdr = 'r';
        html_tp = 'td';
        obj = body;
    }
    tbl.style.display = tbl_display;
    return;
}

function mk_vline(arr, cls) {
    if (arr.length != 0) {
        show_vline(arr, cls);
    }
}

function show_vline(arr, cls) {
    mk_subtxt(arr, ['GCELL', 'VLINE', ...cls], ' ', 2, 1);
}

function mk_hline(obj) {
    var row = document.createElement('tr');
    var cell=show_hline(obj, ['HLINE'], 48);
    row.appendChild(cell);
    obj.appendChild(row);
}

function show_hline(obj, cls, num) {    
    var td = document.createElement('td');
    td.classList.add(cls);
    td.colSpan = num;
    return td;
}


function add_row(arr, obj, tp, cl) {
    var row = null;
    if (arr.length != 0) {
        row = mk_row(tp, arr, cl);
    } else {
        row = document.createElement('tr');
    }

    obj.appendChild(row);
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
    }
    );
    return box;
}

var hue_filter = {
    GLYPH: 0,
    VERB: 20,
    C1: 40,
    C5: 50,
    LIT: 80,
    MEANING: 100,
    C2: 120,
    C6: 130,
    NUM: 160,
    LOC: 180,
    C3: 200,
    C7: 210,
    PREP: 240,
    C4: 260,
    C8: 280,
    C0: 310,
    CX: 320,
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
        var cl = i[3];
        var cell = document.createElement(tp);

        cl.push(row_class);
        var attr = {};

        cl.forEach(cls => {
            attr[cls] = 1;
        }
        );

        var is_header = false;
        var bright_val = 100;
        if ('HDR' in attr) {
            is_header = true;
            bright_val = bright_filter['HDR'];
        }

        var hue_val = 0;
        var attr_keys = Object.keys(attr);
        cell.classList.add(...attr_keys);

        if (!('COLOR' in attr)) {
            cl.forEach(att => {
                if (bright_val == 100) {
                    if (att in bright_filter) {
                        bright_val = bright_filter[att];
                    }
                }
                if (hue_val == 0) {
                    if (att in hue_filter) {
                        hue_val = hue_filter[att];
                    }
                }
            }
            );

            cell.style.filter = 'brightness(' + bright_val + '%) hue-rotate(' + hue_val + 'deg)';
        }

        if (rows > 1) {
            cell.rowSpan = rows;
        }
        if (cols > 1) {
            cell.colSpan = cols;
        }

        cell.appendChild(gbutton(item, is_header, cl));
        row.appendChild(cell);
    }
    );
    return row;
}

function do_say(what) {
    speechSynthesis.cancel();

    var selvoice = document.getElementById('voiceSelect').selectedOptions[0].textContent;

    let utterance = new SpeechSynthesisUtterance(what);
    utterance.lang = 'en-US';
    utterance.pitch = 1;
    utterance.rate = .6;
    utterance.volume = 1;
    if (selvoice != null) {
        utterance.voice = voice_lookup[voiceSelect.value];
    }

    speechSynthesis.speak(utterance);
}

function class_to_row_column(tgt_class) {
    let tgt_uc = tgt_class.toUpperCase();
    let image_list = [];
    if (tgt_uc in cat_map) {
        let tgt_key = cat_map[tgt_uc];
        if (tgt_key in category) {
            var rec = category[tgt_key];
        }
    }
    return rec;
}

const hide_cell = 'HIDECELL';
var glyph_final = {};

function glyph_data(rec) {
    let row = rec[0];
    let col = rec[1];
    let name = '';
    let ttip = '';
    let sound = '';

    if (row >= 0) {
        name += 'R' + row;
        ttip += sounds['C'][row][0];
        sound += sounds['C'][row][1];
    } else {
        sound += sounds['C'][(col * 5) % 16][1];
        // For Vowel sound
    }
    if (col >= 0) {
        name += 'C' + col;
        ttip += sounds['V'][col][0];
        sound += sounds['V'][col][1];
    } else {
        sound += sounds['V'][(row * 5) % 8][1];
        // For Consonate sound
    }

    if (sound in sound_fix) {
        sound = sound_fix[sound];
        ttip += ' {' + sound + '}';
    }

    glyph_final[name] = sound;

    return [name, ttip, sound];
}

function gbutton(item, is_hdr, cl) {
    var button = item;

    if (Array.isArray(item)) {
        var item_list = [];
        var glyph_tool = '';
        var glyph_sound = '';
        var soundsep = '';

        if (Array.isArray(item[0])) {
            item.forEach(i => {
                let irec = glyph_data(i);
                item_list.push(irec[0]);
                glyph_tool += irec[1];
                glyph_sound += soundsep + irec[2];
                soundsep = '-';
            }
            );
        } else {
            let rec = glyph_data(item);
            item_list = rec[0];
            glyph_tool = rec[1];
            glyph_sound = rec[2];
        }
        button = getImage(item_list, IMG_SZ, 'button');
        button.classList.add('GLYPHBUTTON');
        button.setAttribute('title', glyph_tool);

        button.onclick = function () {
            do_say(glyph_sound);
        }
            ;
        return button;
    } else if (!is_hdr) {
        return item;
    }

    // Button to subslect from table -- single items will show prepend character

    button = document.createElement('button');
    button.appendChild(item);
    button.classList.add('GBUTTON', ...item.classList);

    let tgt = base_class(cl);
    var show_single = true;

    var hdr = document.getElementById('glyphheader');
    button.onclick = function () {
        var gc = document.getElementsByClassName('GCELL');
        if (show_single) {
            // One Class

            for (const elem of gc) {
                var cls = new Set(elem.classList);
                if (cls.has(tgt)) {
                    elem.classList.remove(hide_cell);
                } else {
                    elem.classList.add(hide_cell);
                }
            }
        } else {
            // Full Table
            for (const elem of gc) {
                var cls = new Set(elem.classList);
                if (cls.has('GROUPHIDE')) {
                    elem.classList.add(hide_cell);
                } else {
                    elem.classList.remove(hide_cell);
                }
            }
        }

        show_single = !show_single;
    }
        ;

    return button;
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
    const val_strip = val_raw.replace(/[,*]/g, '');
    // remove all ,
    const val = Number(val_strip);
    // convert to number

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
        seq = cp(zero_seq);
        // copy so zero_seq doesn't get modified
        if (val <= n_inf_val) {
            seq = n_inf_seq;
            alt = 'Too Low';
        } else if (val == 0) {
            alt = 'Zero';
        } else {
            seq = convertnum(-1 * val, seq);
            // val is negative, copy seq so it
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

        if (prowB > 0) {
            // using a multiplier
            if (prowB > 6) {
                // it's on the second hand
                prowA = 5 + Math.floor(prowB / 6);
                pvalA = getnum(prowA);
                prowB -= pvalA;
            }
            pvalB = getnum(prowB);
        }

        args = [glyph != null, h, w, p];

        var nlit = num_sound(nrow);
        var nobj = mk_numglyph(nrow, ...args);
        if (msep == '-') {
            // negative
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
                                get_live_text(row + 1, 0), // get_spirit_text(row + 1, 0), SINGLE (live and spirit have the same text)
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

on_ready_blobs([['data/datacols.csv', 'cols', load_cols], ['data/glyph_data.csv', 'gdata', load_gdata], ['data/glyph_sound.csv', 'gsound', load_gsound], //    ['badfile.csv', 'bf', simple_csv_to_arr_of_arr], // TEST BAD FILE
], handle_blobs);
