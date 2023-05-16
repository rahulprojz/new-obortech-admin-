const SHA256 = require('crypto-js/sha256')
const { getAccess } = require('../utils/IPFSHelpers/index')
const { callAPI } = require('../helpers/user-helper')
const db = require('../models')
const mdb = require('../models/mangoose/index.model')
const data_usage_policy = db.data_usage_polices
const project = db.projects
const Event = db.events
const IntegritionMatrix = db.integrity_matrix
const IntegritionMatrixRelations = db.integrity_matrix_relations

class IntegrityChecker {
    constructor(type, uniqueId, pdc, user, res) {
        this.type = type
        this.uniqueId = uniqueId
        this.pdc = pdc || ''
        this.orgName = (function () {
            if (user.organization) {
                return user.organization.blockchain_name
            }
            return false
        })()
        this.userName = (function () {
            if (user.username) {
                return user.unique_id
            }
            return false
        })()
        this.user_unique_id = user.unique_id
        this.response = res
        this.db = (async () => {
            if (this.type === 'policy') {
                return data_usage_policy
            }
            if (this.type === 'project') {
                return project
            }
            if (this.type === 'event') {
                return Event
            }
            if (this.type === 'eventsubmission') {
                const ProjectEvents = await mdb.project_event(user.organization.blockchain_name)
                return ProjectEvents
            }
        })()

        this.query = (() => {
            if (this.type === 'policy') {
                return { where: { policy_id: this.uniqueId } }
            }
            if (this.type === 'project') {
                return { where: { uniqueId: this.uniqueId } }
            }
            if (this.type === 'event') {
                return { where: { uniqId: this.uniqueId } }
            }
            if (this.type === 'eventsubmission') {
                return { event_submission_id: this.uniqueId, pdc_id: this.pdc }
            }
        })()
    }

    async fetchIntegrityData() {
        let error = ''
        const { ledger, local, couch } = await this.fetchAndMapData()
        const localHash = SHA256(local).toString()
        const ledgerHash = SHA256(ledger).toString()
        const couchHash = SHA256(couch).toString()
        if (this.type !== 'eventsubmission') {
            if (localHash !== ledgerHash) {
                error += 'local and ledger data is not matched,'
            }
            if (ledgerHash !== couchHash) {
                error += 'ledger and couch data is not matched'
            }
        }
        if (localHash !== couchHash) {
            error += 'local and couch data is not matched,'
        }
        const activeTable = await this.db
        if (error) {
            this.type === 'eventsubmission' ? await activeTable.update(this.query, { integrity_status: 0, integrity_error: error, integrity_checked_at: new Date() }) : await activeTable.update({ integrity_status: 0, integrity_error: error, integrity_checked_at: new Date() }, this.query)
        } else {
            this.type === 'eventsubmission' ? await activeTable.update(this.query, { integrity_status: 1, integrity_error: '', integrity_checked_at: new Date() }) : await activeTable.update({ integrity_status: 1, integrity_error: '', integrity_checked_at: new Date() }, this.query)
        }
        const res = await activeTable.findOne(this.query)
        return {
            message: error || 'integrity matched',
            data: res,
        }
    }

    async fetchAndMapData() {
        const activeTable = await this.db
        const local = await this.fetchLocalData(activeTable)
        const { ledger, couch } = await this.fetchBlockchainData()
        return { local, ledger, couch }
    }

    async fetchBlockchainData() {
        const data = { type: this.type, uniqId: this.uniqueId, pdc: this.pdc }
        const payload = { orgName: this.orgName, userName: this.userName, data }
        const token = await getAccess(this.user_unique_id)
        const response = await callAPI('integrity/history', payload, null, token)
        if(!response.success) throw new Error(response.message)
        if (response.data) {
            const { data, history } = response.data
            const localLedgerData = await this.fetchMatrix('ledger')
            const localCouchData = await this.fetchMatrix('couch')
            const ledger = await this.wrapData(localLedgerData, history)
            const couch = await this.wrapData(localCouchData, data)
            return { ledger, couch }
        }
        const activeTable = await this.db
        this.type === 'eventsubmission'
            ? await activeTable.update(this.query, { integrity_status: 0, integrity_error: response.message, integrity_checked_at: new Date() })
            : await activeTable.update({ integrity_status: 0, integrity_error: response.message, integrity_checked_at: new Date() }, this.query)
        const res = await activeTable.findOne(this.query)
        /* this.response.status(400).json({
            message: response.message,
            data: res,
        }) */
        return false
    }

    async wrapData(localData, blockchainData) {
        let string = ''
        if (localData && blockchainData) {
            const activeColumns = localData.columns.split(',')
            activeColumns.map((column) => {
                const activeColumn = blockchainData[column]
                if (activeColumn !== undefined) {
                    string += `${activeColumn},`
                }
            })
        }
        return string
    }

    async fetchLocalData(activeTable) {
        let mapedString = ''
        const mapedData = await this.mapMatrixLocal(activeTable)
        mapedData && Object.keys(mapedData).map((item) => (mapedString += `${mapedData[item]},`))
        return mapedString
    }

    async mapMatrixLocal(activeTable) {
        const options = Object.assign({}, this.query)
        options.raw = true
        const matrixData = await this.fetchMatrix('local')
        if (!matrixData && !matrixData.columns) {
            return false
        }
        const activeColumns = matrixData.columns.split(',')
        options.attributes = activeColumns
        if (matrixData.integrity_matrix_relations) {
            const matrixRelations = matrixData.integrity_matrix_relations
            const includes = []
            matrixRelations.forEach(({ child, columns }) => {
                includes.push({
                    model: db[child],
                    attributes: [columns],
                })
            })
            options.include = includes
        }
        if (this.type === 'eventsubmission') {
            const selections = ['-_id', ...activeColumns]
            const raw = await activeTable.findOne(this.query).select(selections).exec()
            const response = JSON.stringify(raw)
            return JSON.parse(response)
        }
        console.log({ options })
        const response = await activeTable.findOne(options)
        return response
    }

    async fetchMatrix(type) {
        return await IntegritionMatrix.findOne({
            where: {
                name: this.type,
                type,
            },
            include: [{ model: IntegritionMatrixRelations }],
            attributes: ['columns', 'type'],
        })
    }
}

module.exports = IntegrityChecker
