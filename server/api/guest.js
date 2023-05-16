// Load dependencies
const express = require('express')
const multipart = require('connect-multiparty')
const exec = require('await-exec')
const fs = require('fs')
const s3Helper = require('../helpers/s3-helper')
const projectHelper = require('../helpers/project-helper')
const { fileTypeCheck, fileNameSplit } = require('../utils/globalHelpers')
const fsp = fs.promises
const AWS = require('aws-sdk')
const router = express.Router()
const multipartMiddleware = multipart({ maxFieldsSize: 300000000 })

// Split PDF into images
router.post('/split-pdf', multipartMiddleware, async (req, res) => {
    try {
        const filedata = req.files.file
        const userId = req.body.user_id
        const currentTimeStamp = Date.now().toString().slice(-4)
        const tempPath = filedata.path
        const uploadPath = 'server/upload/'

        if (filedata) {
            const pdfDestPath = uploadPath + filedata.name.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase()

            // Delete all old files
            const allFiles = fs.readdirSync(uploadPath)
            if (allFiles) {
                const pFiles = allFiles.map(async (file) => {
                    if (file.includes(`page_${userId}`)) {
                        fsp.unlink(uploadPath + file)
                    }
                })
                Promise.all(pFiles)
            }

            // Save original PDF
            fsp.readFile(tempPath).then(async (data) => {
                // Write the file
                const bufdata = Buffer.from(data)
                fsp.writeFile(pdfDestPath, bufdata).then(async () => {
                    // Convert PDF to Image
                    await exec(`python3 python-scripts/split-pdf.py ${pdfDestPath} ${userId} ${currentTimeStamp}`).then(async (error, stdout, stderr) => {
                        if (error.stderr) {
                            res.json({ success: false, message: error.stderr })
                        }

                        const images = []
                        let base64 = ''
                        const newImageFiles = fs.readdirSync(uploadPath)
                        if (newImageFiles) {
                            newImageFiles.map((file) => {
                                if (file.includes(`page_${userId}`)) {
                                    images.push(file)
                                    if (file.includes(`page_${userId}_1_`)) {
                                        base64 = fs.readFileSync(uploadPath + file, 'base64')
                                    }
                                }
                            })
                        }
                        res.json({ success: true, images, base64 })
                    })
                })
            })
        }
    } catch (err) {
        res.json({ success: false })
    }
})

// Convert document
router.post('/convert-document', multipartMiddleware, async (req, res) => {
    try {
        const filedata = req.files.file
        const { user_id } = req.body

        if (filedata) {
            const upload_path = 'server/upload/'
            const oldpath = filedata.path
            const clean_file_name = filedata.name.toString().replace(/[^a-zA-Z0-9.]/g, '')
            const destpath = `${upload_path}${clean_file_name.toLowerCase()}`

            // Delete all old files
            const allFiles = fs.readdirSync(upload_path)
            if (allFiles) {
                const pFiles = allFiles.map(async (file) => {
                    if (file.includes(`page_${user_id}`)) {
                        await fsp.unlink(upload_path + file)
                    }
                })
                await Promise.all(pFiles)
            }

            // Read the file
            await fsp.readFile(oldpath).then(async (data) => {
                // Write the file
                const bufdata = Buffer.from(data)
                await fsp.writeFile(destpath, bufdata).then(async (data) => {
                    // Convert file to PDF
                    await exec(`libreoffice --headless --convert-to pdf ${destpath} --outdir ${upload_path}`).then(async (error, stdout, stderr) => {
                        if (error.stderr) {
                            res.json({ success: false })
                        }

                        // Split PDF and get first page data
                        const currentTimeStamp = Date.now().toString().slice(-4)
                        const pdf_file_path = destpath.replace('.docx', '.pdf').replace('.xlsx', '.pdf').replace('.pptx', '.pdf')
                        await exec(`python3 python-scripts/split-pdf.py ${pdf_file_path} ${user_id} ${currentTimeStamp}`).then(async (error, stdout, stderr) => {
                            if (error.stderr) {
                                res.json({ success: false })
                            }

                            const images = []
                            let base64 = ''
                            const allFiles = fs.readdirSync(upload_path)
                            if (allFiles) {
                                allFiles.map((file, i) => {
                                    if (file.includes(`page_${user_id}`)) {
                                        images.push(file)
                                        if (file.includes('_1_')) {
                                            base64 = fs.readFileSync(upload_path + file, 'base64')
                                        }
                                    }
                                })
                            }
                            // Delete PDF file
                            await fsp.unlink(pdf_file_path)
                            res.json({ success: true, images, base64 })
                        })
                    })
                })
            })
        }
    } catch (err) {
        console.log(err)
        res.json({ success: false })
    }
})

// Save PDF
router.post('/save-pdf', multipartMiddleware, async (req, res) => {
    try {
        const upload_path = 'server/upload/'
        const filedata = req.files.file
        const { user_id, event_submission_id } = req.body
        const pdfImages = req.body.pdf_images.split(',').join(' ')
        const filename = `server/upload/${filedata.name
            .toString()
            .replace(/[^a-zA-Z0-9.]/g, '')
            .replace(/.jpeg|.jpg|.png/gi, '.pdf')
            .replace('.pdf', `_${user_id}_${event_submission_id}.pdf`)}`
        if (filedata) {
            exec(`/usr/bin/img2pdf ${pdfImages} -o ${filename.toLowerCase()}`).then(async (error, stdout, stderr) => {
                if (error.stderr) {
                    res.json({ success: false })
                }

                const allFiles = fs.readdirSync(upload_path)
                if (allFiles) {
                    allFiles.map(async (file) => {
                        if (file.includes(`page_${user_id}`)) {
                            await fsp.unlink(upload_path + file)
                        }
                    })
                }
                res.json({ success: true })
            })
        }
    } catch (err) {
        console.log(err)
        res.json({ success: false })
    }
})

router.post('/onsortend-image', async (req, res) => {
    const upload_path = 'server/upload/'
    const { orderOfArray } = req.body
    const base64 = fs.readFileSync(upload_path + orderOfArray[0].name, 'base64')
    res.json({ base64 })
})
// Save Edited Images
router.post('/save-editedImage', async (req, res) => {
    try {
        const filedata = req.body.imageUrl
        const { name, orderOfArray } = req.body
        let knownTypes = [
            { type: 'data:image/jpg;base64,', regex: /^data:image\/jpg;base64,/ },
            { type: 'data:image/jpeg;base64,', regex: /^data:image\/jpeg;base64,/ },
            { type: 'data:image/png;base64,', regex: /^data:image\/png;base64,/ },
        ]
        if (filedata) {
            const upload_path = 'server/upload/'
            const nameSplit = name.split('_')
            const currentTimeStamp = nameSplit[nameSplit.length - 1]
            const destpath = `${upload_path}${name}`
            // Delete  file
            const allFiles = fs.readdirSync(upload_path)
            if (allFiles) {
                const pFiles = allFiles.map(async (file) => {
                    if (file.includes(name)) {
                        await fsp.unlink(upload_path + file)
                    }
                })
                await Promise.all(pFiles)
            }
            const regex = knownTypes.find((types) => filedata.includes(types.type))
            const base64Data = filedata.replace(regex.regex, '')
            const writeData = await fsp.writeFile(destpath, base64Data, 'base64')

            let images = []
            const dataFiles = await fs
                .readdirSync(upload_path)
                .filter((f) => f.endsWith(nameSplit[nameSplit.length - 1]))
                .map((f) => {
                    const split = f.split('_')
                    return {
                        name: f,
                        index: split[2],
                    }
                })
                .sort((a, b) => a.index - b.index)
                .map((f) => f.name)

            for (let i = 0; i < dataFiles.length; i++) {
                if (dataFiles[i].includes(currentTimeStamp)) {
                    if (orderOfArray && orderOfArray.length) {
                        const indexObject = orderOfArray.find((order) => order.name == dataFiles[i])
                        images[indexObject.index] = dataFiles[i]
                    } else {
                        images.push(dataFiles[i])
                    }
                }
            }
            images = images.filter((img) => img)
            res.json({ success: true, images })
        }
    } catch (err) {
        console.log(err)
        res.json({ success: false })
    }
})
// Save Images
router.post('/save-images', multipartMiddleware, async (req, res) => {
    try {
        const filedata = req.files.file

        if (filedata) {
            const upload_path = 'server/upload/'
            // Delete all old files
            const allFiles = fs.readdirSync(upload_path, { withFileTypes: true })
            if (allFiles) {
                const pFiles = allFiles.map(async (file) => {
                    if (fileTypeCheck(file.name)) await fsp.unlink(upload_path + file.name)
                })
                await Promise.all(pFiles)
            }
            const currentTimeStamp = Date.now().toString().slice(-4)
            for (let i = 0; i < filedata.length; i++) {
                const oldpath = filedata[i].path
                const clean_file_name = filedata[i].name.replace(/[^a-zA-Z0-9.]/g, '')
                const destpath = `${upload_path}${clean_file_name.toLowerCase()}_${currentTimeStamp}`
                // Read the file
                const readData = await fsp.readFile(oldpath)
                // Write the file
                const bufdata = Buffer.from(readData)
                const writeData = await fsp.writeFile(destpath, bufdata)
            }
            const images = []
            const dataFiles = await fs.readdirSync(upload_path)
            if (dataFiles) {
                dataFiles.map((file, i) => {
                    if (file.includes(currentTimeStamp)) {
                        images.push(file)
                    }
                })
            }
            const base64 = fs.readFileSync(upload_path + images[0], 'base64')
            res.json({ success: true, images, base64 })
        }
    } catch (err) {
        console.log(err)
        res.json({ success: false })
    }
})

router.post('/getPdf', async (req, res) => {
    try {
        const s3 = new AWS.S3({
            accessKeyId: process.env.Amazon_accessKeyId,
            secretAccessKey: process.env.Amazon_secretAccessKey,
            region: process.env.Amazon_region,
        })
        const params = {
            Bucket: 'blockchaindoc', // pass your bucket name
            Key: req.body.name, // file will be saved as testBucket/contacts.csv
        }
        await s3.getObject(params, function (err, data) {
            if (err) {
                throw err
            }
            fs.writeFileSync(`server/upload/${req.body.name}`, data.Body)
            res.json({ success: true })
        })
    } catch (err) {
        // logger.error(err)
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/deleteFile', async (req, res) => {
    try {
        const upload_path = 'server/upload/'
        const path = upload_path + req.body.file
        const { orderOfArray } = req.body
        const splitFile = req.body.file.split('_')
        fs.unlinkSync(path)

        let images = []
        let base64 = ''
        const allFiles = fs
            .readdirSync(upload_path)
            .filter((f) => f.endsWith(splitFile[splitFile.length - 1]))
            .map((f) => {
                const split = f.split('_')
                return {
                    name: f,
                    index: split[2],
                }
            })
            .sort((a, b) => a.index - b.index)
            .map((f) => f.name)

        const firstImage = false
        if (allFiles) {
            allFiles.map((file, i) => {
                if (file.includes(splitFile[splitFile.length - 1])) {
                    if (orderOfArray && orderOfArray.length) {
                        const imagefile = orderOfArray.find((img) => img.name == file)
                        images[imagefile.index] = file
                    } else {
                        images.push(file)
                    }
                }
            })
            images = images.filter((img) => img)
            if (images.length) {
                base64 = fs.readFileSync(upload_path + images[0], 'base64')
            }
        }
        res.json({ success: true, images, base64 })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/upload-attachment', multipartMiddleware, async (req, res) => {
    try {
        const { user_id, event_submission_id } = req.body
        const response = await s3Helper.uploadFile(req.files.file, user_id, event_submission_id)
        res.json({ attachment: { originalFile: response.originalFile, fileLocation: response.file_location } })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.post('/download-attachment', multipartMiddleware, async (req, res) => {
    try {
        const upload_path = 'server/upload/'
        const filedata = req.files.file
        const { user_id } = req.body
        const pdfImages = req.body.pdf_images.split(',').join(' ')
        const filename = `${upload_path}${filedata.name
            .toString()
            .replace(/[^a-zA-Z0-9.]/g, '')
            .replace(/.jpeg|.jpg|.png/gi, '.pdf')}`
        if (filedata) {
            exec(`/usr/bin/img2pdf ${pdfImages} -o ${filename.toLowerCase()}`).then(async (error, stdout, stderr) => {
                if (error.stderr) {
                    res.json({ success: false })
                }
                const base64 = fs.readFileSync(filename.toLowerCase(), 'base64')
                res.json({
                    success: true,
                    base64,
                    file: filename.toLowerCase(),
                    filename: filedata.name
                        .toString()
                        .replace(/[^a-zA-Z0-9.]/g, '')
                        .replace(/.jpeg|.jpg|.png/gi, '.pdf'),
                })
            })
        }
    } catch (err) {
        res.json({ success: false })
    }
})

router.get('/send-pdc-req-email', async (req, res) => {
    try {
        const { id } = req.query
        console.log('guest/send-pdc-req-email API called... id-> ', id)
        await projectHelper.sendPdcReqMail(id)

        res.json({ success: true })
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
