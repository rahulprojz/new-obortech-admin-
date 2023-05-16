function base64ToFileType(base64, filename) {
    if (base64.startsWith('/9j/')) {
        return `${filename}.jpeg`
    }
    const matches = base64 && base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
    if (!matches) return false
    const type = matches[1].split('/')[1]
    const activeFile = `${filename}.${type}`
    return activeFile
}
module.exports = base64ToFileType
