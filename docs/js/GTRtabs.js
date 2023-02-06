'use strict';

var fake_tab_background = '#e8e8ff'

function set_fake_tab_background(color) {
    fake_tab_background = color;
}

function fake_tabs(tab_name, tab_class, tab_button) {
    var tabcontent = document.getElementsByClassName(tab_class);
    for (var i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    var tabbuttons = document.getElementsByClassName(tab_button);

    for (var j = 0; j < tabcontent.length; j++) {
        tabbuttons[j].style.backgroundColor = "buttonface";
    }
    var tab = document.getElementById(tab_name);
    tab.style.display = "block";
}

function show_tab(btn, name) {
    fake_tabs(name, "display_tab", "tab_button");
    btn.style.backgroundColor = fake_tab_background;
}