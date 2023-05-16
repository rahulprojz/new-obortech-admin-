const moment = require('moment-timezone')
import string from './LanguageTranslation.js'
import _ from 'lodash'
import notify from '../lib/notifier'

export const _momentDate = (date = new Date()) => {
    return moment(date)
}

export const _momentDateFormat = (date = new Date(), format = 'YYYY-MM-DD HH:mm:ss') => {
    return _momentDate(date).format(format)
}

export const _momentGetDiff = (startDate = new Date(), endDate, limit) => {
    return _momentDate(startDate).diff(_momentDate(endDate), limit)
}

export const _momentGetEndDiff = (startDate = new Date(), endDate, limit) => {
    return _momentDate(endDate).diff(_momentDate(startDate), limit)
}

export const getLocalTime = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
    const timezoneOffset = new Date().getTimezoneOffset()
    return moment(date, 'YYYY-MM-DD HH:mm:ss').add(-timezoneOffset, 'minutes').format(format)
}

export const momentStaticAgo = (date, format) => {
    const momentAgo = moment(getLocalTime(date, format)).fromNow()
    const agoString = _.camelCase(momentAgo.replace(/\d+/g, ''))
    const textAgo = /\d/g.test(momentAgo) ? `${momentAgo.replace(/\D+/g, '')} ${string.moment[agoString]}` : string.moment[agoString]
    return textAgo
}

export const groupBy = (list, keyGetter, formatBy, dayformat) => {
    const map = new Map()
    list?.forEach((item) => {
        let setKey = ''
        if (dayformat == 'week') {
            let localdate = getLocalTime(keyGetter(item))
            let start_week = moment(localdate).clone().startOf('isoWeek').format(formatBy)
            let currentweek = moment(localdate).clone().endOf('isoWeek').format(formatBy)
            setKey = start_week + ' to ' + currentweek
        } else {
            let localdate = getLocalTime(keyGetter(item))
            setKey = moment(localdate).format(formatBy)
        }
        const collection = map.get(setKey)
        if (!collection) {
            map.set(setKey, [item])
        } else {
            collection.push(item)
        }
    })
    return map
}

export const getUniqueListBy = (arr, key) => {
    return [...new Map(arr.map((item) => [item[key], item])).values()]
}

export const dynamicLanguageStringChange = (string, obj) => {
    if (obj && typeof obj === 'object') {
        Object.keys(obj).map((key) => {
            if (string && string.indexOf(`{{${key}}}`) !== -1) {
                string = string.replace(`{{${key}}}`, obj[key])
            }
        })
        return string
    }
    return string
}

export const sanitize = (string) => {
    return (
        string
            ?.toString()
            .replace(/[^a-zA-Z]/g, '')
            .toLowerCase() || ''
    )
}

export const isValidJsonString = (str) => {
    try {
        JSON.parse(str)
    } catch (e) {
        return false
    }
    return true
}

export const b64toBlob = (b64Data, fileName, contentType = 'image/jpg', sliceSize = 512) => {
    const byteCharacters = atob(b64Data)
    const byteArrays = []

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize)

        const byteNumbers = new Array(slice.length)
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i)
        }

        const byteArray = new Uint8Array(byteNumbers)
        byteArrays.push(byteArray)
    }

    const blob = new Blob(byteArrays, { type: contentType })
    const fileBlob = new File([blob], fileName, { lastModified: new Date().getTime(), type: contentType })
    return fileBlob
}

export function getBase64Image(imgName, callback) {
    var img = new Image()
    img.onload = function () {
        var canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        var ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        var dataURL = canvas.toDataURL('image/png')

        callback(dataURL) // the base64 string
    }
    // set attributes and src
    img.setAttribute('crossOrigin', 'anonymous') //
    img.src = `/server/upload/${imgName}`
}

export const checkFileSize = (file) => {
    // The size of the file.
    const fsize = Math.round((file?.size || 0) / 1024)

    if (fsize > 3072) {
        notify(string.event.fileSizeError)
        return true
    }
    return false
}

// Generate uniq id
export const _generateUniqId = () => {
    const uniqId = Math.random().toString(36).substr(2, 9)
    return uniqId.toLowerCase().toString()
}

export const _momentCheckPastDate = (date) => {
    return moment(date).isBefore()
}

export const getDateDiffText = (startDate, endDate = new Date(), isPastDate = false) => {
    const momentStartDate = isPastDate ? _momentDate(endDate) : _momentDate(startDate)
    const momentEndDate = isPastDate ? _momentDate(startDate) : _momentDate(endDate)

    const formats = ['year', 'month', 'day', 'hour', 'minute', 'second']

    for (let i = 0; i < formats.length; i++) {
        const dateDiff = momentStartDate.diff(momentEndDate, formats[i])
        if (dateDiff) {
            return { dateDiff, dateFormat: formats[i] }
        }
    }
    return { dateDiff: 0 }
}

export const getLocalDBValue = (projectId) => {
    const selectionData = window.localStorage.getItem(`${projectId}_selection`)
    const parsedValue = !!selectionData && typeof selectionData === 'string' ? JSON.parse(selectionData) : {}
    const localDBValue = Object.values(parsedValue).length > 0 ? Object.values(parsedValue)[0].value : false

    return !localDBValue
}

export const removeDataFromLS = (keys = []) => {
    keys.map((key) => localStorage.removeItem(key))
}
