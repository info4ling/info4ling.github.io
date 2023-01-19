// LOADS FILES AND TRIGGERS STARTUP FUNCTION AFTER THE DOM IS READY

// `todo` is array of tuples [ file , line_process_func ]
function on_ready_blobs(todo, after) {
    var proms = [ready_promise()];
    todo.forEach(bfile_rec => {
        proms.push(blob_promise(bfile_rec[0], bfile_rec[1]));
    });
    Promise.all(proms).then((values) => {
        console.log(values);
        after(values);
    });

    function ready_promise() {
        return new Promise((resolve) => {
            if (document.readyState != "loading")
                return resolve();
            else
                document.addEventListener("DOMContentLoaded", function () {
                    return resolve();
                });
        });
    }

    function blob_promise(filename, line_func) {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.open("GET", filename);
            xhr.responseType = 'text';
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(blob_to_obj(xhr.responseText, line_func));
                } else {
                    reject(xhr.statusText);
                }
            };
            xhr.onerror = () => reject(xhr.statusText);
            xhr.send();
        });

        function blob_to_obj(blob, func) {
            var lines = blob.split(/\n/);
            var arr = null;
            for (let i = 0; i < lines.length; ++i) {
                func(lines[i]);
            }
            return blob;
        }
    }
}

function comma_split(line) {
    return line.split(/,/);
}

function simple_csv_to_arr_of_arr(current, line) {
    if (current == null) {
        current = [];
    }
    current.push(comma_split(line));
    return current;
}

function simple_csv_to_dict(current, line) {
    if (current == null) {
        current = {};
    }

    var data = comma_split(line);
    var key = data.shift();
    current[key] = data;

    return current;
}

function simple_csv_to_dict_of_dict(current, line) {
    if (current == null) {
        current = {};
    }

    var data = comma_split(line);
    var key1 = data.shift();
    var key2 = data.shift();
    if (current[key1] == null) {
        current[key1] = {};
    }
    current[key1][key2] = data;

    return current;
}