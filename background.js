
function openPanel() {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true});
    console.log("background loaded")
}

function connectGoogleAccount() {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
        console.log("token is:", token);
        if (chrome.runtime.lastError) {
            console.log("error message is:", chrome.runtime.lastError.message);
            //console.error("Auth failed", chrome.runtime.lastError);
            //return;
        }
        chrome.storage.local.set({ authToken: token }, () => {

        });
    });
}