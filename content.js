console.log("Content script loaded.");

// Initialize on script load
checkAndShowLockScreen();

function createLockScreen() {
  // Check if lock screen already exists and remove it first
  const existingLockScreen = document.getElementById('profileLockScreen');
  if (existingLockScreen) {
    existingLockScreen.remove();
  }

  // Create lockScreen element first
  const lockScreen = document.createElement('div');
  lockScreen.id = 'profileLockScreen';
  lockScreen.style.position = 'fixed';
  lockScreen.style.top = '0';
  lockScreen.style.left = '0';
  lockScreen.style.width = '100%';
  lockScreen.style.height = '100%';
  lockScreen.style.backgroundColor = '#1c1c1c';
  lockScreen.style.zIndex = '9999';
  lockScreen.style.display = 'flex';
  lockScreen.style.justifyContent = 'center';
  lockScreen.style.alignItems = 'center';
  
  // Set innerHTML after creating the element
  lockScreen.innerHTML = `
    <div style="background-color: #1c1c1c; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); width: 300px; text-align: center;">
      <h1 style="color: #ffffff;">Profile Locked</h1>
      <input type="password" id="passwordInput" placeholder="Enter Password" style="width: 100%; padding: 8px; margin: 8px 0; border: 1px solid #333; border-radius: 4px; box-sizing: border-box; background-color: #2c2c2c; color: #ffffff;">
      <button id="unlockButton" style="width: 100%; padding: 10px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;">Unlock</button>
      <div id="error" style="color: #ff4444; font-size: 12px; margin-top: 5px; display: none;">Incorrect password!</div>
    </div>`;

  // Add to DOM
  document.body.insertBefore(lockScreen, document.body.firstChild);

  // Get elements after they're in the DOM
  const unlockButton = document.getElementById('unlockButton');
  const passwordInput = document.getElementById('passwordInput');
  const errorDiv = document.getElementById('error');

  if (!unlockButton || !passwordInput || !errorDiv) {
    console.error('Required elements not found');
    return;
  }

  // Handle unlock button click
  const handleUnlock = () => {
    const enteredPassword = passwordInput.value.trim();
    console.log("Unlock button clicked");

    chrome.storage.local.get(['password', 'profileLocked'], (data) => {
      console.log("Stored password exists:", !!data.password);
      
      if (enteredPassword === data.password) {
        chrome.storage.local.set({ profileLocked: false }, () => {
          console.log("Profile unlocked successfully");
          if (document.getElementById('profileLockScreen')) {
            document.getElementById('profileLockScreen').remove();
          }
          window.removeEventListener('beforeunload', preventNavigation);
        });
      } else {
        errorDiv.style.display = 'block';
        errorDiv.textContent = 'Incorrect password!';
        passwordInput.value = '';
        passwordInput.focus();
      }
    });
  };

  // Add event listeners
  unlockButton.addEventListener('click', handleUnlock);
  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUnlock();
    }
  });

  // Focus the input
  passwordInput.focus();
}

function preventNavigation(event) {
  event.preventDefault();
  event.returnValue = ''; // Required for Chrome to show a confirmation dialog
}

// Modify checkAndShowLockScreen for better initialization
function checkAndShowLockScreen() {
  chrome.storage.local.get(['profileLocked', 'setupComplete', 'password'], (data) => {
    console.log("Lock screen check:", {
      profileLocked: data.profileLocked,
      setupComplete: data.setupComplete,
      hasPassword: !!data.password
    });

    if (data.setupComplete && data.profileLocked && data.password) {
      if (document.readyState === 'complete') {
        createLockScreen();
      } else {
        document.addEventListener('DOMContentLoaded', createLockScreen);
      }
    }
  });
}