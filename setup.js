document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const saveButton = document.getElementById('savePassword');
    const errorDiv = document.getElementById('error');

    saveButton.addEventListener('click', () => {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (password !== confirmPassword) {
            errorDiv.style.display = 'block';
            return;
        }

        if (password.length < 4) {
            errorDiv.textContent = 'Password must be at least 4 characters long!';
            errorDiv.style.display = 'block';
            return;
        }

        // Save the password and mark setup as complete
        chrome.storage.local.set({
            password: password,
            setupComplete: true,
            profileLocked: true
        }, () => {
            console.log("Password saved:", password); // Add this log
            chrome.tabs.getCurrent((tab) => {
                chrome.tabs.remove(tab.id);
                chrome.tabs.create({ url: 'chrome://newtab' });
            });
        });
    });
});