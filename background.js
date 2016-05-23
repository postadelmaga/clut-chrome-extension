var mru = [];
var switchOngoing = false;
var intSwitchCount = 0;
var lastIntSwitchIndex = 0;
var backswitch = false;

var initialized = false;

var loggingOn = true;

var CLUTlog = function (str) {
    if (loggingOn) {
        console.log(str);
    }
}

function onInstall() {
    CLUTlog("Extension Installed");
}

function onUpdate() {
    CLUTlog("Extension Updated");
    chrome.windows.create({url: "http://www.harshay-buradkar.com/clut_update2.html"});
}

function getVersion() {
    var details = chrome.app.getDetails();
    return details.version;
}

// Check if the version has changed.
var currVersion = getVersion();
var prevVersion = localStorage['version']
CLUTlog("version: " + prevVersion);
if (currVersion != prevVersion) {
// Check if we just installed this extension.
    if (typeof prevVersion == 'undefined') {
//   onInstall();
// } else {
        onUpdate();
    }
    localStorage['version'] = currVersion;
}

// check alt key
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.alt == 0) {
            endSwitch();
        }
    });

chrome.commands.onCommand.addListener(function (command) {
    CLUTlog('Command recd:' + command);
    backswitch = false;
    if (command == "alt_switch_backward") {
        backswitch = true;
    }

    if (!switchOngoing) {
        switchOngoing = true;
        CLUTlog("CLUT::START_SWITCH");
        intSwitchCount = 0;
        doIntSwitch();
    } else {
        CLUTlog("CLUT::DO_INT_SWITCH");
        doIntSwitch();
    }
});

chrome.runtime.onStartup.addListener(function () {
    CLUTlog("on startup");
    initialize();

});

chrome.runtime.onInstalled.addListener(function () {
    CLUTlog("on startup");
    initialize();

});


var doIntSwitch = function () {
    CLUTlog("CLUT:: in int switch, intSwitchCount: " + intSwitchCount + ", mru.length: " + mru.length);
    if (intSwitchCount < mru.length && intSwitchCount >= 0) {
        var tabIdToMakeActive;
        //check if tab is still present
        //sometimes tabs have gone missing
        var invalidTab = true;
        var thisWindowId;
        if (backswitch) {
            decrementSwitchCounter();
        } else {
            incrementSwitchCounter();
        }
        tabIdToMakeActive = mru[intSwitchCount];
        chrome.tabs.get(tabIdToMakeActive, function (tab) {
            if (tab) {
                thisWindowId = tab.windowId;
                invalidTab = false;

                chrome.windows.update(thisWindowId, {"focused": true});
                chrome.tabs.update(tabIdToMakeActive, {active: true, highlighted: true});
                lastIntSwitchIndex = intSwitchCount;
                //break;
            } else {
                CLUTlog("CLUT:: in int switch, >>invalid tab found.intSwitchCount: " + intSwitchCount + ", mru.length: " + mru.length);
                removeItemAtIndexFromMRU(intSwitchCount);
                if (intSwitchCount >= mru.length) {
                    intSwitchCount = 0;
                }
                doIntSwitch();
            }
        });


    }
}

var endSwitch = function () {
    CLUTlog("CLUT::END_SWITCH");
    switchOngoing = false;
    var tabId = mru[lastIntSwitchIndex];
    putExistingTabToTop(tabId);
    printMRUSimple();
}

chrome.tabs.onActivated.addListener(function (activeInfo) {
    if (!switchOngoing) {
        var index = mru.indexOf(activeInfo.tabId);

        //probably should not happen since tab created gets called first than activated for new tabs,
        // but added as a backup behavior to avoid orphan tabs
        if (index == -1) {
            CLUTlog("Unexpected scenario hit with tab(" + activeInfo.tabId + ").")
            addTabToMRUAtFront(activeInfo.tabId)
        } else {
            putExistingTabToTop(activeInfo.tabId);
        }
    }
});

chrome.tabs.onCreated.addListener(function (tab) {
    CLUTlog("Tab create event fired with tab(" + tab.id + ")");
    addTabToMRUAtBack(tab.id);
});

chrome.tabs.onRemoved.addListener(function (tabId, removedInfo) {
    CLUTlog("Tab remove event fired from tab(" + tabId + ")");
    removeTabFromMRU(tabId);
});


var addTabToMRUAtBack = function (tabId) {

    var index = mru.indexOf(tabId);
    if (index == -1) {
        //add to the end of mru
        mru.splice(-1, 0, tabId);
    }

}

var addTabToMRUAtFront = function (tabId) {

    var index = mru.indexOf(tabId);
    if (index == -1) {
        //add to the front of mru
        mru.splice(0, 0, tabId);
    }

}
var putExistingTabToTop = function (tabId) {
    var index = mru.indexOf(tabId);
    if (index != -1) {
        mru.splice(index, 1);
        mru.unshift(tabId);
    }
}

var removeTabFromMRU = function (tabId) {
    var index = mru.indexOf(tabId);
    if (index != -1) {
        mru.splice(index, 1);
    }
}

var removeItemAtIndexFromMRU = function (index) {
    if (index < mru.length) {
        mru.splice(index, 1);
    }
}

var incrementSwitchCounter = function () {
    intSwitchCount = (intSwitchCount + 1) % mru.length;
}

var decrementSwitchCounter = function () {
    if (intSwitchCount == 0) {
        intSwitchCount = mru.length - 1;
    } else {
        intSwitchCount = intSwitchCount - 1;
    }
}

var initialize = function () {

    if (!initialized) {
        initialized = true;
        chrome.windows.getAll({populate: true}, function (windows) {
            windows.forEach(function (window) {
                window.tabs.forEach(function (tab) {
                    mru.unshift(tab.id);
                });
            });
            CLUTlog("MRU after init: " + mru);
        });
    }
}

var printTabInfo = function (tabId) {
    var info = "";
    chrome.tabs.get(tabId, function (tab) {
        info = "Tabid: " + tabId + " title: " + tab.title;
    });
    return info;
}

var str = "MRU status: \n";
var printMRU = function () {
    str = "MRU status: \n";
    for (var i = 0; i < mru.length; i++) {
        chrome.tabs.get(mru[i], function (tab) {

        });
    }
    CLUTlog(str);
}

var printMRUSimple = function () {
    CLUTlog("mru: " + mru);
}

var generatePrintMRUString = function () {
    chrome.tabs.query(function () {

    });
    str += (i + " :(" + tab.id + ")" + tab.title);
    str += "\n";

}



