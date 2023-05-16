const english = require('../../utils/stringConstants/language/eng.json')
let string = english

function get_language_json(language) {
    let currentlanguage = language ? language : 'US'
    if (currentlanguage == 'US') {
        return english
    }
}

if (typeof window !== 'undefined') {
    let languageSelected = window.localStorage.getItem('language') ? window.localStorage.getItem('language') : 'US'
    string = get_language_json(languageSelected)
}

module.exports = exports = string
