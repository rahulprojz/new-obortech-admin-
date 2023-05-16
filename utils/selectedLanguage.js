export const getSelectedLanguage = () => {
    const selectedLanguage = typeof window !== 'undefined' && window.localStorage.getItem('language')
    return selectedLanguage !== 'US' ? selectedLanguage : ''
}

export const otherLanguage = getSelectedLanguage() ? 'MN' : ''
