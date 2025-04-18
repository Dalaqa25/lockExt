// Check if this is the first installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.tabs.create({
            url: 'setup.html'
        });
    }
});

// Lock profile on browser startup
chrome.runtime.onStartup.addListener(() => {
    injectLockScreen();
});

// Function to inject lock screen into all tabs
function injectLockScreen() {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
            if (tab.id && tab.url && tab.url.startsWith('https://www.google.com')) {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                }).catch((err) => {
                    console.error(`Failed to inject content script into tab ${tab.id}:`, err);
                });
            }
        });
    });
}

// Listen for new tab creation
chrome.tabs.onCreated.addListener((tab) => {
    if (tab.id && tab.url && tab.url.startsWith('https://www.google.com')) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        }).catch((err) => {
            console.error(`Failed to inject content script into new tab ${tab.id}:`, err);
        });
    }
});

// Listen for tab updates to ensure lock screen appears on navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('https://www.google.com')) {
        chrome.storage.local.get(['profileLocked', 'setupComplete'], (data) => {
            if (data.setupComplete && data.profileLocked) {
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content.js']
                }).catch((err) => {
                    console.error(`Failed to inject content script into updated tab ${tabId}:`, err);
                });
            }
        });
    }
});