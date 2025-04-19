console.log("Content script loaded.");

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
  lockScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  lockScreen.style.zIndex = '9999';
  lockScreen.style.display = 'flex';
  lockScreen.style.justifyContent = 'center';
  lockScreen.style.alignItems = 'center';
  
  // Set innerHTML after creating the element
  lockScreen.innerHTML = `
    <div style="background-color: white; padding: 20px; border-radius: 5px; text-align: center;">
      <h1>Profile Locked</h1>
      <input type="password" id="passwordInput" placeholder="Enter Password" style="padding: 8px; margin: 10px 0;">
      <button id="unlockButton" style="padding: 8px 16px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Unlock</button>
      <div id="error" style="color: red; margin-top: 10px; display: none;">Incorrect password!</div>
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

// Initialize on script load
checkAndShowLockScreen();