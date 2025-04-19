// Check if this is the first installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.tabs.create({
            url: 'setup.html'
        });
    }
});

// Modify onStartup listener to handle immediate locking
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get(['setupComplete'], (data) => {
        if (data.setupComplete) {
            chrome.storage.local.set({ profileLocked: true }, () => {
                console.log("Profile locked on startup");
                // Force create new tab with Google
                chrome.tabs.create({ 
                    url: 'https://www.google.com',
                    active: true
                }, (tab) => {
                    // Ensure lock screen is injected into the new tab
                    setTimeout(() => {
                        chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            files: ['content.js']
                        }).catch((err) => {
                            console.error('Failed to inject lock screen:', err);
                        });
                    }, 500); // Small delay to ensure page is ready
                });
            });
        }
    });
});

// Add listener for browser window focus
chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId !== chrome.windows.WINDOW_ID_NONE) {
        chrome.storage.local.get(['setupComplete', 'profileLocked'], (data) => {
            if (data.setupComplete && data.profileLocked) {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0] && isGoogleUrl(tabs[0].url)) {
                        chrome.scripting.executeScript({
                            target: { tabId: tabs[0].id },
                            files: ['content.js']
                        }).catch((err) => {
                            console.error('Failed to inject lock screen:', err);
                        });
                    }
                });
            }
        });
    }
});

// Function to inject lock screen into all tabs
function injectLockScreen() {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
            if (tab.id && tab.url && isGoogleUrl(tab.url)) {
                chrome.storage.local.get(['profileLocked', 'setupComplete'], (data) => {
                    if (data.setupComplete && data.profileLocked) {
                        console.log(`Injecting lock screen into tab ${tab.id}`); // Add this log
                        chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            files: ['content.js']
                        }).catch((err) => {
                            console.error(`Failed to inject content script into tab ${tab.id}:`, err);
                        });
                    }
                });
            }
        });
    });
}

// Listen for new tab creation
chrome.tabs.onCreated.addListener((tab) => {
    if (tab.id && tab.url && isGoogleUrl(tab.url)) {
        chrome.storage.local.get(['profileLocked', 'setupComplete'], (data) => {
            if (data.setupComplete && data.profileLocked) {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                }).catch((err) => {
                    console.error(`Failed to inject content script into new tab ${tab.id}:`, err);
                });
            }
        });
    }
});

// Listen for tab updates to ensure lock screen appears on navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && isGoogleUrl(tab.url)) {
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

// Listen for browser window close
chrome.windows.onRemoved.addListener((windowId) => {
    chrome.storage.local.get(['setupComplete'], (data) => {
        if (data.setupComplete) {
            chrome.storage.local.set({ profileLocked: true }, () => {
                console.log("Profile locked on window close");
            });
        }
    });
});

// Helper function to check if URL is a Google URL
function isGoogleUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname === 'www.google.com' || urlObj.hostname === 'google.com';
    } catch (e) {
        return false;
    }
}