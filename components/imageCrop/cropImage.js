import { dataURLtoFile } from './dataURLtoFile'

// create the image with a src of the base64 string
const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image()
        image.addEventListener('load', () => resolve(image))
        image.addEventListener('error', (error) => reject(error))
        image.setAttribute('crossOrigin', 'anonymous')
        image.src = url
    })

export const getCroppedImg = async (imageSrc, crop, fileName) => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    /* setting canvas width & height allows us to 
    resize from the original image resolution */
    canvas.width = 500
    canvas.height = 500

    ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height)

    return new Promise((resolve) => {
        canvas.toBlob(
            (blob) => {
                resolve(new File([blob], fileName, { lastModified: new Date().getTime(), type: blob.type }))
            },
            'image/jpeg',
            1,
        )
    })
}
