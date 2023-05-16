/* eslint-disable consistent-return */

// Plans class check double conditions and destructure the payload accordingly
class Plans {
    constructor(items, subscription) {
        this.planChecks = [
            {
                type: '1',
                itemID: 'usr1',
                plan_key: 'user',
            },
            {
                type: '1',
                itemID: 'usr2',
                plan_key: 'regular_user',
            },
            {
                type: '1',
                itemID: 'orgnode',
                plan_key: 'manager',
            },
            {
                type: '4',
                itemID: 'item',
                plan_key: 'items',
            },
        ]
        this.items = items
        this.subscription = subscription
    }

    plans() {
        const plans = []
        this.items.forEach((item) => {
            const planRef = this.destructData(item)
            if (planRef) {
                plans.push(planRef)
            }
        })
        return plans
    }

    destructData(item) {
        const { type, qty, itemID } = item
        const checkExist = this.planChecks.find((active) => active.itemID === itemID && active.type === type)
        if (checkExist) {
            return { plan_key: checkExist.plan_key, plan_value: qty, plan_type: 'CREDIT', subscription_id: this.subscription }
        }
    }
}

module.exports = { Plans }
