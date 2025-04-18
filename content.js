console.log("Content script loaded.");

function createLockScreen() {
  // Check if lock screen already exists
  if (document.getElementById('profileLockScreen')) {
    return;
  }

  const lockScreen = document.createElement('div');
  lockScreen.id = 'profileLockScreen';
  lockScreen.style.position = 'fixed';
  lockScreen.style.top = '0';
  lockScreen.style.left = '0';
  lockScreen.style.width = '100%';
  lockScreen.style.height = '100%';
  lockScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent black
  lockScreen.style.zIndex = '9999'; // Ensure it's on top of everything
  lockScreen.style.display = 'flex';
  lockScreen.style.justifyContent = 'center';
  lockScreen.style.alignItems = 'center';
  lockScreen.innerHTML = `
    <div style="background-color: white; padding: 20px; border-radius: 5px; text-align: center;">
      <h1>Profile Locked</h1>
      <input type="password" id="passwordInput" placeholder="Enter Password" style="padding: 8px; margin: 10px 0;">
      <button id="unlockButton" style="padding: 8px 16px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Unlock</button>
      <div id="error" style="color: red; margin-top: 10px; display: none;">Incorrect password!</div>
    </div>`;

  // Insert the lock screen at the beginning of the body
  if (document.body) {
    document.body.insertBefore(lockScreen, document.body.firstChild);
  } else {
    // If body doesn't exist yet, wait for it
    const observer = new MutationObserver((mutations, obs) => {
      if (document.body) {
        document.body.insertBefore(lockScreen, document.body.firstChild);
        obs.disconnect();
      }
    });
    observer.observe(document.documentElement, { childList: true });
  }

  const unlockButton = document.getElementById('unlockButton');
  const errorDiv = document.getElementById('error');

  unlockButton.addEventListener('click', () => {
    const passwordInput = document.getElementById('passwordInput');
    const enteredPassword = passwordInput.value;

    chrome.storage.local.get('password', (data) => {
      if (enteredPassword === data.password) {
        chrome.storage.local.set({ profileLocked: false }, () => {
          console.log("Profile unlocked.");
          lockScreen.remove();
          window.removeEventListener('beforeunload', preventNavigation);
        });
      } else {
        errorDiv.style.display = 'block';
        passwordInput.value = '';
      }
    });
  });

  // Focus the password input
  const passwordInput = document.getElementById('passwordInput');
  if (passwordInput) {
    passwordInput.focus();
  }
}

function preventNavigation(event) {
  event.preventDefault();
  event.returnValue = ''; // Required for Chrome to show a confirmation dialog
}

// Check if profile is locked and show lock screen
function checkAndShowLockScreen() {
  chrome.storage.local.get(['profileLocked', 'setupComplete'], (data) => {
    if (data.setupComplete && data.profileLocked) {
      console.log("Profile is locked, showing lock screen.");
      createLockScreen();
      window.addEventListener('beforeunload', preventNavigation);
    } else if (!data.setupComplete) {
      console.log("Setup not complete, waiting for password setup.");
    } else {
      console.log("Profile is not locked.");
    }
  });
}

// Run immediately and also when DOM is ready
checkAndShowLockScreen();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkAndShowLockScreen);
}