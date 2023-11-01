const tab_history = new Set();

function init() {
    browser.tabs.query({}).then((tabs) => {
        for (const tab of tabs) {
            tab_history.add(tab.id);
        }
    })
}

function handleCreated(tab) {
    const tabId = tab.id;
    tab_history.add(tabId);
}

function handleRemoved(tabId, removeInfo) {
    tab_history.delete(tabId);
}

function handleActivated(activeInfo) {
    const activeId = activeInfo.tabId;
    if (tab_history.has(activeId)) {
        tab_history.delete(activeId);
        tab_history.add(activeId);
    }
}

browser.tabs.onCreated.addListener(handleCreated);
browser.tabs.onRemoved.addListener(handleRemoved);
browser.tabs.onActivated.addListener(handleActivated);
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action == "getTabHistory") {
        sendResponse({ tabHistory: Array.from(tab_history) });
    }
});

init();