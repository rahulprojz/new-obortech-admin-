/* eslint-disable consistent-return */
const moment = require('moment')
const db = require('../../models')

const DeviceContractModal = db.device_contract
const DeviceContractUsage= db.device_contract_usage

class DeviceContract {
    constructor(organization, items) {
        this.deviceCheck = [
            {
                type: '2',
                itemID: 'rmb-bs',
                duration: 6,
            },
            {
                type: '3',
                itemID: 'rmb-rbt',
                duration: 12,
            },
        ]
        this.organization = organization
        this.items = items
    }

    devices() {
        const devices = []
        for (let index = 0; index < this.items.length; index++) {
            const item = this.items[index]
            const planRef = this.destructDeviceData(item)
            if (planRef) {
                devices.push(planRef)
            }
        }
        return devices
    }

    destructDeviceData(item) {
        const { type, qty, itemID } = item
        const checkExist = this.deviceCheck.find((active) => active.itemID === itemID && active.type === type)
        if (checkExist) {
            const endDate = moment().add(checkExist.duration, 'M')
            return { device_id: checkExist.itemID, organization_id: this.organization, quantity: qty, type: 'CREDIT', duration: checkExist.duration, start_date: new Date(), end_date: endDate, status: true }
        }
    }

    // eslint-disable-next-line class-methods-use-this
    async checkDeviceCountAndSubscription(key) {
        const deviceContract = await DeviceContractModal.findOne({
            where: {
                id: key,
                status: true,
            },
        })
        if (deviceContract) {
            const endDateRef = deviceContract.end_date
            const endDate = moment(endDateRef)
            const currentTime = moment()
            const deviceSubscriptionValid = moment(currentTime).isBefore(endDate, 'hours')
            if (deviceSubscriptionValid) {
                const deviceCount = await DeviceContractUsage.count({
                    where: {
                        device_contract_id: deviceContract.device_id,
                        type: 'DEBIT',
                    },
                })
                const activeQuantity = deviceContract.quantity
                if (activeQuantity === deviceCount) {
                    return { status: 200, message: `${deviceContract.device_id} count available.` }
                }
                return { status: 400, message: `${deviceContract.device_id} count used!` }
            }
            return { status: 400, message: 'Device Subscription Expired!' }
        }
        return { status: 400, message: 'Device Subscription Expired!' }
    }

    async appendCount(deviceContractId) {
        await DeviceContractUsage.create({
            device_contract_id: deviceContractId,
            type: 'DEBIT',
        })
    }

    // update the device duration if exist otherwise create one
    async createAndUpdateDevices(devices) {
        devices.forEach((activeDevice) => {
            ;(async () => {
                const deviceExist = await DeviceContractModal.findOne({ where: { organization_id: this.organization, device_id: activeDevice.device_id, type: 'CREDIT', status: true } })
                if (deviceExist) {
                    const currentDeviceEndDate = deviceExist.end_date
                    const startDate = moment()
                    const pendingDays = moment(currentDeviceEndDate).diff(startDate, 'days')
                    let endDate = moment().add(activeDevice.duration, 'M')
                    if (pendingDays > 0) {
                        endDate = moment(endDate).add(pendingDays, 'days')
                    }
                    const device = Object.assign(activeDevice, { end_date: endDate })
                    await DeviceContractModal.create(device)
                    await DeviceContractModal.update(
                        {
                            status: false,
                        },
                        {
                            where: {
                                id: deviceExist.id,
                            },
                        },
                    )
                } else {
                    await DeviceContractModal.create(activeDevice)
                }
            })()
        })
    }
}
module.exports = { DeviceContract }
