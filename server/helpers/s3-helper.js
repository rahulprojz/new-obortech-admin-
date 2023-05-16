// Add Project Helper
const path = require('path')
const exec = require('await-exec')
const fs = require('fs')

const fsp = fs.promises
const AWS = require('aws-sdk')
const md5File = require('md5-file')

const s3Bucket = new AWS.S3({ params: { Bucket: 'blockchaindoc' } })
const base64ToFileType = require('../utils/base64Convertor')

// Upload File to AWS S3
const uploadFile = async (filedata, user_id, unique_id) => {
    try {
        if (filedata) {
            const upload_path = 'server/upload/'
            const clean_file_name = filedata.name.toString().replace(/[^a-zA-Z0-9.]/g, '')
            // const oldpath = directUploadImages ? `${upload_path}${filedata.name.replace(/[^a-zA-Z0-9.]/g, '').replace(/.jpeg|.jpg|.png/gi, '.pdf')}` : filedata.path
            const oldpath = `${upload_path}${filedata.name
                .replace(/[^a-zA-Z0-9.]/g, '')
                .replace(/.jpeg|.jpg|.png/gi, '.pdf')
                .replace('.pdf', `_${user_id}_${unique_id}.pdf`)}`
            let destpath = upload_path + clean_file_name.toLowerCase().replace('.pdf', `_${user_id}_${unique_id}.pdf`)
            const originalFile = upload_path + clean_file_name.toLowerCase()
            let pdf_file_path = ''
            let returnPath = ''
            // Uplaod PDF
            if (filedata.type == 'application/pdf') {
                returnPath = await _uploadToS3(filedata.type, destpath, null, null, upload_path, user_id, originalFile)
            }

            // Uplaod DOCX
            if (filedata.type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                returnPath = await _uploadToS3(filedata.type, destpath, null, null, upload_path, user_id, originalFile)
            }

            // Uplaod PPTX
            if (filedata.type == 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
                returnPath = await _uploadToS3(filedata.type, destpath, null, null, upload_path, user_id, originalFile)
            }

            // Uplaod XLXS
            if (filedata.type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                returnPath = await _uploadToS3(filedata.type, destpath, null, null, upload_path, user_id, originalFile)
            }

            // Upload Images
            if (filedata.type == 'image/jpeg' || filedata.type == 'image/jpg' || filedata.type == 'image/png') {
                // Read the file
                await fsp.readFile(oldpath.toLowerCase()).then(async (data) => {
                    // Write the file
                    const bufdata = Buffer.from(data)
                    await fsp.writeFile(destpath, bufdata).then(async (data) => {
                        if (filedata.type == 'image/jpeg' || filedata.type == 'image/jpg') {
                            pdf_file_path = destpath.replace(/.jpeg|.jpg|.png/gi, '.pdf').replace('.pdf', `_${user_id}_${unique_id}.pdf`)
                            // Convert image file to pdf
                            await exec(`python python-scripts/img2pdf.py ${destpath} ${pdf_file_path}`).then(async (error, stdout, stderr) => {
                                if (error.stderr) {
                                    throw stderr
                                }

                                returnPath = await _uploadToS3('application/pdf', pdf_file_path, destpath, filedata.type, upload_path, user_id, originalFile)
                            })
                        } else if (filedata.type == 'image/png') {
                            pdf_file_path = destpath.replace(/.jpeg|.jpg|.png/gi, '.pdf').replace('.pdf', `_${user_id}_${unique_id}.pdf`)
                            destpath = destpath.replace(/.jpeg|.jpg|.png/gi, '')
                            // destpath = destpath.

                            // Convert png to jpg
                            await exec(`python python-scripts/img2pdf.py ${destpath}.png ${destpath}.jpg`).then(async (error, stdout, stderr) => {
                                // Convert image file to pdf
                                await exec(`python python-scripts/img2pdf.py ${destpath}.jpg ${pdf_file_path}`).then(async (error, stdout, stderr) => {
                                    if (error.stderr) {
                                        throw stderr
                                    }
                                    // console.log('image/png', pdf_file_path, destpath)

                                    returnPath = await _uploadToS3('application/pdf', pdf_file_path, `${destpath}.png`, 'image/png', upload_path, user_id, originalFile)
                                    // Delete image file
                                    // await fsp.unlink(`${destpath}.png`)
                                })
                            })
                        }
                    })
                })
            }

            return returnPath
        }
    } catch (err) {
        console.log(JSON.stringify(err))
        return { error: err.message || err.toString() }
    }
}

// Upload file to S3 bucket
const _uploadToS3 = async (file_type, file_path, image_file_path, image_type, upload_path, user_id, originalFile) => {
    try {
        // Upload PDF
        const uploadPdfParams = {}
        const fileStream = fs.createReadStream(file_path)
        fileStream.on('error', function (err) {
            throw err
        })
        uploadPdfParams.Body = fileStream
        uploadPdfParams.Key = path.basename(file_path)
        uploadPdfParams.ContentType = file_type

        const upload_response = await s3Bucket.upload(uploadPdfParams).promise()
        const file_hash = md5File.sync(file_path)

        const returnObj = {
            file_location: path.basename(upload_response.Location),
            file_path,
            file_hash,
            originalFile,
        }

        // Upload Image
        if (image_file_path) {
            const uploadImageParams = {}
            const fileStream = fs.createReadStream(image_file_path)
            fileStream.on('error', function (err) {
                throw err
            })
            uploadImageParams.Body = fileStream
            uploadImageParams.Key = path.basename(image_file_path)
            uploadImageParams.ContentType = image_type

            const image_response = await s3Bucket.upload(uploadImageParams).promise()

            returnObj.image_location = image_response.Location

            // Delete the image from SERVER
            await fsp.unlink(image_file_path)
        }

        // Delete the image from SERVER
        await fsp.unlink(file_path)

        // Delete the original File
        if (fs.existsSync(originalFile)) {
            await fsp.unlink(originalFile)
        }

        const allFiles = fs.readdirSync(upload_path)
        if (allFiles) {
            allFiles.map(async (file, i) => {
                if (file.includes(`page_${user_id}`)) {
                    await fsp.unlink(upload_path + file)
                }
            })
        }

        return returnObj
    } catch (err) {
        return { error: err.message || err.toString() }
    }
}

// Delete connection profile from S3
const deleteFile = async (file_name) => {
    try {
        const params = {
            Bucket: `obortech/${process.env.bucket}`,
            Key: path.basename(file_name),
        }
        s3Bucket.headObject(params, (err, data) => {
            if (err && err.code === 'NotFound') {
                return true
            }
            if (err) reject(err)
            {
                s3Bucket.deleteObject(params, (error, data) => {
                    if (error) {
                        console.log(error)
                    }
                    return true
                })
            }
        })
    } catch (err) {
        return { error: err.message || err.toString() }
    }
}

const uploadS3Base64 = async (base64, fileName) => {
    try {
        const updatedFileName = base64ToFileType(base64, fileName)
        await s3Bucket.upload({ Key: `event_images/${updatedFileName}`, Body: base64 }).promise()
        return updatedFileName
    } catch (err) {
        console.log({ err })
    }
}

const fetchS3File = async (filePath) => {
    try {
        return await s3Bucket.getObject({ Key: filePath }).promise()
    } catch (err) {
        console.log({ err })
    }
}
module.exports = {
    uploadFile,
    deleteFile,
    uploadS3Base64,
    fetchS3File
}
