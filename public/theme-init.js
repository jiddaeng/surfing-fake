(() => {
  'use strict'
  try {
    if (localStorage.getItem('dimi-club-theme') === 'light') document.documentElement.classList.remove('dark')
  } catch (_) { /* Storage can be unavailable in privacy modes. */ }
})()
