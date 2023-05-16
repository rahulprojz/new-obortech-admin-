const express = require('express')
const multipart = require('connect-multiparty')
const fs = require('fs')
const fsp = fs.promises
const exec = require('await-exec')
const router = express.Router()
const db = require('../models')

const multipartMiddleware = multipart({ maxFieldsSize: 300000000 })

const Nft = db.nft
const Item = db.items

router.post('/create-nft-image', multipartMiddleware, async (req, res) => {
    console.log(req.files)
    const filedata = req.files.file
    const itemName = req.body.itemName
    const item = itemName.split(" ").join("_")
    const uniqueId = req.body.unique_id
    const fileType = req.body.fileType
    const filePathOut = `${uniqueId}.${fileType}`
    const filePath = filedata.path
    try {
        if (filedata) {
            await fsp.readdir('server/upload/').then(async (files) => {
                //listing all files using forEach
                files.forEach(async function (file) {
                    var nameSplit = file.split('.')
                    nameSplit.pop()
                    var Filename = nameSplit.join('.')
                    if (uniqueId == Filename) {
                        await fsp.unlink(`server/upload/${file}`)
                    }
                })
                await exec(`python3 python-scripts/text-on-image.py ${filePath} -o ${item} ${filePathOut}`).then(async (error, stdout, stderr) => {
                    const filePathRef = 'server/upload/' + filePathOut
                    res.status(200).json({ code: 200, imgURL: `${process.env.SITE_URL}/${filePathRef}` })
                })
            })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.get('/', async (req, res) => {
    try{
        const { limit,offset = 0 } = req.query
        const filter = {}
        if (limit) {
            filter.distinct = true
            filter.limit = parseInt(limit)
            filter.offset = parseInt(offset)
            filter.order = [['createdAt', 'DESC']]
        }
        const nftDetails = await Nft.findAndCountAll(filter)
        res.json(nftDetails)

    }catch(err){
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
