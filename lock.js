document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('passwordInput');
    const unlockButton = document.getElementById('unlockButton');
    const errorDiv = document.getElementById('error');

    // Focus the password input
    passwordInput.focus();

    // Prevent keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Prevent Alt+F4, Ctrl+W, etc.
        if ((e.altKey && e.key === 'F4') || 
            (e.ctrlKey && e.key === 'w') ||
            (e.ctrlKey && e.key === 'n') ||
            (e.ctrlKey && e.key === 't') ||
            (e.ctrlKey && e.key === 'l') ||
            (e.ctrlKey && e.key === 'k')) {
            e.preventDefault();
        }
    });

    // Function to handle unlock attempt
    function attemptUnlock(password) {
        chrome.storage.local.get(['password', 'profileLocked'], (data) => {
            if (!data.password) {
                console.error('No password found in storage');
                errorDiv.style.display = 'block';
                errorDiv.textContent = 'No password found. Please set up a new password.';
                return;
            }

            if (password === data.password) {
                chrome.storage.local.set({ profileLocked: false }, () => {
                    console.log("Profile unlocked successfully");
                    // Close this window and open Google
                    chrome.windows.getCurrent((window) => {
                        chrome.windows.remove(window.id);
                        chrome.windows.create({
                            url: 'https://www.google.com',
                            state: 'maximized'
                        });
                    });
                });
            } else {
                errorDiv.style.display = 'block';
                errorDiv.textContent = 'Incorrect password!';
                passwordInput.value = '';
                passwordInput.focus();
            }
        });
    }

    // Handle unlock button click
    unlockButton.addEventListener('click', () => {
        const enteredPassword = passwordInput.value.trim();
        if (enteredPassword) {
            attemptUnlock(enteredPassword);
        } else {
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'Please enter a password';
        }
    });

    // Handle Enter key
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const enteredPassword = passwordInput.value.trim();
            if (enteredPassword) {
                attemptUnlock(enteredPassword);
            } else {
                errorDiv.style.display = 'block';
                errorDiv.textContent = 'Please enter a password';
            }
        }
    });
}); 