// Profile Dropdown Menu
document.addEventListener('DOMContentLoaded', function() {
  const userIconContainer = document.querySelector('.user-icon-container');
  const profileDropdown = document.querySelector('.profile-dropdown');
  const profileButton = document.querySelector('.profile-button');

  if (!userIconContainer || !profileDropdown || !profileButton) {
    return; // Exit if elements don't exist
  }

  // Toggle dropdown on button click
  profileButton.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    profileDropdown.classList.toggle('active');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!userIconContainer.contains(e.target)) {
      profileDropdown.classList.remove('active');
    }
  });

  // Close dropdown when a menu item is clicked
  const dropdownItems = profileDropdown.querySelectorAll('a');
  dropdownItems.forEach(item => {
    item.addEventListener('click', function() {
      profileDropdown.classList.remove('active');
    });
  });

  // Close dropdown on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      profileDropdown.classList.remove('active');
    }
  });

  // Handle logout
  const logoutLink = document.getElementById('logoutLink');
  if (logoutLink) {
    logoutLink.addEventListener('click', function(e) {
      e.preventDefault();
      // Clear user session data before redirecting
      sessionStorage.removeItem('SUNPOST_CURRENT_USER');
      localStorage.removeItem('SUNPOST_CURRENT_USER');
      window.location.href = 'login.html';
    });
  }
});
