var alt_key = 18;

if (window == top) {
    window.addEventListener('keydown', startAlt, false); //add the keyboard handler
    window.addEventListener('keyup', stopAlt, false); //add the keyboard handler
}

function startAlt(e) {
    if (e.keyCode == alt_key) {
        chrome.runtime.sendMessage({alt: 1}, function (response) {
        });
    }
}

function stopAlt(e) {
    if (e.keyCode == alt_key) {
        chrome.runtime.sendMessage({alt: 0}, function (response) {
        });
    }
}
