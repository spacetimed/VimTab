const shortcut_map = [];
const key_to_n = {};
const n_to_key = {};

var search_str = '';
var search_mode = false

function generateKeyMap() { 
    for (i = 0; i < 61; i++) {
        if (i >= 0 && i <= 9) {
            key_to_n[i] = i;
            n_to_key[i] = i;
        } else if (i >= 10 && i <= 35) {
            const char = String.fromCharCode(87 + i);
            if (char != 'j' && char != 'k') {
                key_to_n[char] = i;
                n_to_key[i] = char;
            }
        }    
    }
}

function handleRowClick(event) {
    const id = event.currentTarget.getAttribute("data-tabid");
    browser.tabs.update(shortcut_map[id], {
        active: true,
    });
    window.close();
}

function addToTable(table, id, tabMap) {
    const row = table.insertRow(-1);
    row.setAttribute("data-tabid", tabMap[id].rank);
    row.addEventListener("click", handleRowClick);
    const cell1 = row.insertCell(0);
    const cell2 = row.insertCell(1);
    const cell3 = row.insertCell(2);
    const faviconImg = document.createElement("img");
    faviconImg.src = tabMap[id].favIconUrl;
    faviconImg.height = 16;
    cell2.appendChild(faviconImg);
    cell3.textContent = tabMap[id].title;
    if (tabMap[id].rank <= 9 && tabMap[id].rank >= 0) {
        cell1.textContent = tabMap[id].rank;
    } else if (tabMap[id].rank >= 10 && tabMap[id].rank <= 35) {
        cell1.textContent = n_to_key[tabMap[id].rank];
    } else {
        cell1.textContent = '';
    }
}

function keyHandler() {
    const key = event.key.toLowerCase();
    isNum = Boolean(key >= '0' && key <= '9');
    if (search_mode) {
        handleSearchKey(key);
    } else {
        handleNormalKey(key);
    }
}

function handleSearchKey(key) {
    if (key == '/') {
        disableSearchMode();
    } else if (key.length == 1) {
        search_str += key;
        updateSearchBox();
        render();
    } else if (key == 'backspace') {
        if (search_str.length > 0) {
            search_str = search_str.substring(0, search_str.length - 1);
            updateSearchBox();
            render();
        }
    } else if (key == 'enter') {
        if (shortcut_map.length == 1) {
            browser.tabs.update(shortcut_map[0], {active: true});
            window.close();
        } else {
            disableSearchMode();
        }
    }
}

var active_row = -1;
var highlight_mode = false;

function disableHighlightMode() {
    const rows = document.querySelectorAll('.tab-list tr');
    if (highlight_mode) {
        if (active_row >= 0) {
            rows[active_row].classList.remove('highlighted');
        }
        active_row = -1;
        highlight_mode = false;
    }
}

function handleNormalKey(key) {
    isAlpha = Boolean(key >= 'a' && key <= 'z' && key.length == 1);
    isScroll = Boolean(key == 'j' || key == 'k');

    if (isScroll) {
        const rows = document.querySelectorAll('.tab-list tr');
        if (key == 'j') {
            if (active_row >= 0) {
                rows[active_row].classList.remove('highlighted');
            }
            active_row = (active_row + 1) % (rows.length);
            rows[active_row].classList.add('highlighted');
        } else if (key == 'k') {
            if (active_row >= 0) {
                rows[active_row].classList.remove('highlighted');
            }
            active_row = active_row - 1;
            if (active_row < 0) {
                active_row = rows.length - 1;
            }
            rows[active_row].classList.add('highlighted');
        }
        highlight_mode = true;
    } else if (key == 'enter' && highlight_mode) {
        if (search_str.length > 0) {
            browser.tabs.update(shortcut_map[active_row], {active: true});
            window.close();
        } else {
            if (active_row == 0) {
                window.close(); 
            } else {
                browser.tabs.update(shortcut_map[active_row - 1], {active: true});
                window.close();
            }
        }
    } else if (key == '.' && highlight_mode) {
        if (active_row == 0) {
            browser.tabs.query({active: true}).then((tabs) => { 
                for (tab of tabs) {
                    browser.tabs.move(tab.id, {index: 0});
                    return;
                }
            });
        } else {
            browser.tabs.move(shortcut_map[active_row - 1], {index: 0});
        }
    } else if (isNum || (key in key_to_n && key_to_n[key] <= shortcut_map.length)) {
        browser.tabs.update(shortcut_map[key_to_n[key]], {active: true});
        window.close();
    } else if (key == '/') {
        disableHighlightMode();
        enableSearchMode();
    } else if (isAlpha) {
        disableHighlightMode();
        enableSearchMode();
        search_str += key;
        updateSearchBox(search_str);
        render();
    }
}

function updateSearchBox() {
    document.querySelector('span.search_query').textContent = search_str;
}

function enableSearchMode() {
    search_mode = true;
    document.querySelector('.search').style.opacity = 1;
}

function disableSearchMode() {
    search_mode = false;
    document.querySelector('.search').style.opacity = 0;
}

function render() {
    generateKeyMap();
    shortcut_map.length = 0;
    const table = document.querySelector('.tab-list');
    table.innerHTML = '';
    const getMessageHistory = browser.runtime.sendMessage({ action: "getTabHistory" });
    getMessageHistory.then((response) => {
        if (response) {
            const tabHistory = response.tabHistory.reverse();
            const tabMap = {};
            let rank = -1;
            if (search_mode) {
                rank = 0;
            }
            browser.tabs.query({}).then((tabs) => { 
                for (tab of tabs) {
                    tabMap[tab.id] = tab;
                }
                for (const id of tabHistory.values()) {
                    if (!tabMap[id].title.toLowerCase().includes(search_str) &&
                        !tabMap[id].url.toLowerCase().includes(search_str)) {
                        continue;
                    }
                    tabMap[id].rank = rank;
                    if (rank >= 0) {
                        shortcut_map[rank] = tabMap[id].id;
                    }
                    addToTable(table, id, tabMap);
                    rank++;
                }
            });
        }
    });
}

document.addEventListener("DOMContentLoaded", render);
document.addEventListener("keydown", keyHandler);