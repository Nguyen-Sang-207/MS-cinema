// Auto-detect browser language and set Google Translate cookie for non-Vietnamese users
(function() {
  try {
    var lang = navigator.language || navigator.userLanguage;
    if (!lang.toLowerCase().includes('vi')) {
      if (document.cookie.indexOf('googtrans') === -1) {
        document.cookie = 'googtrans=/vi/en; path=/';
        document.cookie = 'googtrans=/vi/en; domain=.' + window.location.hostname + '; path=/';
      }
    }
  } catch(e) {}
})();

window.googleTranslateElementInit = function() {
  new google.translate.TranslateElement({
    pageLanguage: 'vi',
    autoDisplay: false
  }, 'google_translate_element');
};
