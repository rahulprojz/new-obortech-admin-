import english from './stringConstants/language/eng.json'

let language = english

function get_language_json(selectedlanguage) {
    if (selectedlanguage.toLowerCase() == 'us') {
        // English
        return english
    } else if (selectedlanguage.toLowerCase() == 'mn') {
        // Mongolian
        const language = window.localStorage.getItem('languageJson') ? JSON.parse(window.localStorage.getItem('languageJson')) : english
        return language
    } else {
        // English
        return english
    }
}

if (typeof window !== 'undefined') {
    const keyName = window.location.pathname === '/onboarding' ? 'onboardingLanguage' : 'language'
    const selectedLanguage = window.localStorage.getItem(keyName) ? window.localStorage.getItem(keyName) : 'US'
    language = get_language_json(selectedLanguage || 'us')
}

export default language
