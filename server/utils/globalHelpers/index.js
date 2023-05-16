const string = require('../../helpers/LanguageHelper')
const db = require('../../models')

const Language = db.languages
const DEFAULT_LANGUAGE = process.env.defaultLanguage || 'mn'

const fileTypes = ['jpeg', 'png', 'jpg', 'JPG', 'PNG', 'JPEG', 'PDF', 'pdf']

const fileTypeCheck = (fileName) => {
    const splitName = fileName.split('.')
    const typewithId = splitName[splitName.length - 1]
    if (typewithId.split('_').length > 1) {
        const type = typewithId.split('_')[0]
        const isAvailable = fileTypes.includes(type)
        return isAvailable
    }
    return false
}
const fileNameSplit = (filename) => {
    const splitName = filename.split('-')
    return splitName[1]
}

const getLanguageJson = async (language = DEFAULT_LANGUAGE) => {
    try {
        let languageJson = {}
        if (language.toLowerCase() === 'en') {
            languageJson = string
        } else {
            const languageData = await Language.findOne({ where: { code: language.toLowerCase() } })

            languageJson = languageData ? languageData.json || {} : {}
        }

        return Object.keys(languageJson).length > 0 ? languageJson : string
    } catch (error) {
        console.log('Error in GetLanguageJson: -- ', error)
        return string
    }
}

const dynamicLanguageStringChange = (str, obj) => {
    if (typeof obj === 'object') {
        Object.keys(obj).map((key) => {
            if (str && str.indexOf(`{{${key}}}`) !== -1) {
                str = str.replace(`{{${key}}}`, obj[key])
            }
        })
        return str
    }
    return str
}

const titleCase = (txt) => {
    if (!txt) return ''
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
}

const getFullName = (data = {}) => {
    const { first_name = '', last_name = '' } = data
    return `${titleCase(first_name)} ${titleCase(last_name)}`
}

module.exports = {
    getLanguageJson,
    dynamicLanguageStringChange,
    fileTypes,
    fileTypeCheck,
    fileNameSplit,
    getFullName,
}
