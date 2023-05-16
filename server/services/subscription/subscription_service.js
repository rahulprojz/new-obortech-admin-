const db = require('../../models')
const moment = require('moment')
const Plan_inclusion = db.plan_inclusion
const Subscription = db.subscription
const { Op } = db.Sequelize
const { Sequelize } = db


// Plan Inclusion class to handle the subscription create,carry forward,debit and count.
class PlanInclusion {
    constructor(plan_key, user, response) {
        this.plan_key = plan_key
        this.response = response
        this.plan_type = 'DEBIT'
        this.subscription_id = (function () {
            if (!user) return
            const subscription_id = user.organization && user.organization.subscription && user.organization.subscription.id
            if (!subscription_id) {
                return response.status(400).json({ error: 'Subscription not exist' })
            }
            return subscription_id
        })()
    }

    // find subscription and check there existing plan
    async checkCountExist() {
        await this.checkSubscription()
        return await this.checkPlan()
    }

    // check subscription expire by adding one month in purchase date
    async checkSubscription() {
        const subscription = await Subscription.findOne({
            attributes: ['purchase_date'],
            where: {
                id: this.subscription_id,
            },
        })

        if (!subscription) {
            this.response.status(400).json({ error: 'Subscription not exist' })
        }

        const today = moment()
        const purchaseDate = moment(subscription.purchase_date)
        const futureMonth = moment(purchaseDate).add(1, 'M').format('YYYY-MM-DD')
        const subscriptionExpire = moment(today, 'YYYY-MM-DD', true).isBefore(futureMonth)

        if (!subscriptionExpire) {
            this.response.status(400).json({ error: 'Subscription expired!' })
        }

        return subscriptionExpire
    }

    // check credit counts is used or not!
    async checkPlan() {
        const creditPlanKey = await this.checkCreditPlan()

        const debitPlanKey = await Plan_inclusion.count({
            where: { plan_type: 'DEBIT', plan_key: this.plan_key, subscription_id: this.subscription_id },
        })

        if (creditPlanKey && debitPlanKey) {
            const creditPlanValue = creditPlanKey
            const debitPlanValue = debitPlanKey
            if (debitPlanValue >= creditPlanValue) {
                return this.response.status(400).json({ error: this.plan_key + ' plan used' })
            }
        }

        return true
    }

    //create plan inclusion in debit count
    async appendCount() {
        await Plan_inclusion.create({
            subscription_id: this.subscription_id,
            plan_key: this.plan_key,
            plan_value: 1,
            plan_type: this.plan_type,
        })
    }

    // fetch credit and carry forward plans by subscription id and then merge them to find the actual credit count
    // by subscription id only
    async getCredit(subscription_id) {
        const creditPlans = await Plan_inclusion.findAll({
            attributes: ['plan_key', 'plan_value', 'plan_type', 'subscription_id'],
            where: {
                plan_type: 'CREDIT',
                subscription_id,
            },
        })

        const cfPlans = await Plan_inclusion.findAll({
            attributes: ['plan_key', 'plan_value', 'plan_type', 'subscription_id'],
            where: {
                plan_type: 'CF',
                subscription_id,
            },
        })

        if (creditPlans && cfPlans) {
            cfPlans.forEach((value) => {
                const currentCredit = creditPlans.findIndex(({ plan_key }) => plan_key === value.plan_key)
                creditPlans[currentCredit].plan_value += value.plan_value
            })
        }

        return creditPlans
    }

    // fetch debit count and group them by plan_key
    async getDebit(subscription_id) {
        try {
            const debitPlan = await Plan_inclusion.findAll({
                attributes: ['plan_key', [Sequelize.fn('count', Sequelize.col('plan_key')), 'plan_value']],
                where: {
                    plan_type: 'DEBIT',
                    subscription_id,
                },
                group: ['plan_key'],
            })
            return debitPlan
        } catch (err) {
            console.log(err)
        }
    }
    // fetch credit and carry forward plans by subscription id and then merge them to find the actual credit count
    // by subscription id,plan_key
    async checkCreditPlan() {
        let creditPlanKey = await Plan_inclusion.findOne({
            attributes: ['plan_value', 'plan_key'],
            where: { plan_type: 'CREDIT', plan_key: this.plan_key, subscription_id: this.subscription_id },
        })
        if (!creditPlanKey) {
            this.response.status(400).json({ error: `${this.plan_key} plan not exist` })
        }

        const cfPlans = await Plan_inclusion.findOne({
            attributes: ['plan_key', 'plan_value', 'plan_type', 'subscription_id'],
            where: {
                plan_type: 'CF',
                plan_key: this.plan_key,
                subscription_id: this.subscription_id,
            },
        })
        if (cfPlans) {
            creditPlanKey = creditPlanKey.plan_value + cfPlans.plan_value
        } else {
            creditPlanKey = creditPlanKey.plan_value
        }

        return creditPlanKey
    }

    // find last subscriptions un-used counts and then carry forward them with
    // new subscription
    async generateCarryForward(creditPlans, debitPlans, subscription) {
        const carryForwardPlans = []
        if (creditPlans && debitPlans) {
            debitPlans.forEach((value) => {
                const currentCredit = creditPlans.findIndex(({ plan_key }) => plan_key === value.plan_key)
                creditPlans[currentCredit].plan_value -= value.plan_value
            })
        }
        creditPlans.forEach(({ plan_value, plan_key }) => {
            if (plan_value) {
                carryForwardPlans.push({
                    plan_type: 'CF',
                    subscription_id: subscription,
                    plan_value,
                    plan_key,
                })
            }
        })
        return await Plan_inclusion.bulkCreate(carryForwardPlans)
    }
}

module.exports = { PlanInclusion }
