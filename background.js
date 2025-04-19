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
    chrome.storage.local.get(['setupComplete'], (data) => {
        if (data.setupComplete) {
            // Always set profile as locked on startup
            chrome.storage.local.set({ profileLocked: true }, () => {
                console.log("Profile locked on startup");
                // Create a new Google tab
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
                    }, 500);
                });
            });
        }
    });
});

// Listen for tab updates to prevent navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading') {
        chrome.storage.local.get(['profileLocked', 'setupComplete'], (data) => {
            if (data.setupComplete && data.profileLocked) {
                // If trying to navigate away from Google, redirect back to Google
                if (!isGoogleUrl(tab.url)) {
                    chrome.tabs.update(tabId, { url: 'https://www.google.com' });
                }
                // Ensure lock screen is injected
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content.js']
                }).catch((err) => {
                    console.error(`Failed to inject content script into tab ${tabId}:`, err);
                });
            }
        });
    }
});

// Listen for new tab creation
chrome.tabs.onCreated.addListener((tab) => {
    chrome.storage.local.get(['profileLocked', 'setupComplete'], (data) => {
        if (data.setupComplete && data.profileLocked) {
            // If new tab is not Google, redirect to Google
            if (!isGoogleUrl(tab.url)) {
                chrome.tabs.update(tab.id, { url: 'https://www.google.com' });
            }
            // Inject lock screen
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            }).catch((err) => {
                console.error(`Failed to inject content script into new tab ${tab.id}:`, err);
            });
        }
    });
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