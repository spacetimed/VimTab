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
            key_to_n[char] = i;
            n_to_key[i] = char;
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

function handleKey() {
    const key = event.key.toLowerCase();
    isNum = Boolean(key >= '0' && key <= '9');
    isAlpha = Boolean(key >= 'a' && key <= 'z' && key.length == 1);

    if (search_mode) {
        if (key == '/') {
            disableSearchMode();
        } else if (key.length == 1) {
            search_str += key;
            updateSearchBox();
            display();
        } else if (key == 'backspace') {
            if (search_str.length > 0) {
                search_str = search_str.substring(0, search_str.length - 1);
                updateSearchBox();
                display();
            }
        } else if (key == 'enter') {
            if (shortcut_map.length == 1) {
                browser.tabs.update(shortcut_map[0], {active: true});
                window.close();
            } else {
                disableSearchMode();
            }
        }
    } else if (isNum || (key in key_to_n && key_to_n[key] <= shortcut_map.length)) {
        browser.tabs.update(shortcut_map[key_to_n[key]], {active: true});
        window.close();
    } else if (key == '/') {
        enableSearchMode();
    } else if (isAlpha) {
        enableSearchMode();
        search_str += key;
        updateSearchBox(search_str);
        display();
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

function display() {
    generateKeyMap();
    shortcut_map.length = 0;
    const table = document.querySelector('.tab-list');
    table.innerHTML = '';
    const getMessageHistory = browser.runtime.sendMessage({ action: "getTabHistory" });

    getMessageHistory.then( (response) => {
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

document.addEventListener("DOMContentLoaded", display);
document.addEventListener("keydown", handleKey);