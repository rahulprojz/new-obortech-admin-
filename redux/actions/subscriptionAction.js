/* eslint-disable camelcase */
import moment from 'moment'
import { CHECK_SUBSCRIPTION, SUBSCRIPTION_CLOSED, SUBSCRIPTION_DETAILS } from '../types'
import string from '../../utils/LanguageTranslation'
import { fetchDetails } from '../../lib/api/subscription'

const checkPlan = (user) => {
    function checkTrialPlan(purchase_date) {
        const expireDays = 30
        const usedPlanDays = moment(new Date()).diff(purchase_date, 'days')
        const planExpiry = expireDays - usedPlanDays + 1
        if (planExpiry <= 0) {
            const error = {
                show: true,
                message: string.subscription.subscriptionTrialExpire,
                title: string.subscription.subscriptionTrialExpireTitle,
            }
            return {
                payload: { error, planExpireIn: null, subscriptionPlan: '' },
                type: CHECK_SUBSCRIPTION,
            }
        }
        const error = {
            show: false,
            message: '',
            title: '',
        }
        return { type: CHECK_SUBSCRIPTION, payload: { subscriptionPlan: 'trial', planExpireIn: planExpiry, error } }
    }

    function checkSubscribedPlan(duration, purchase_date, plan) {
        const expireDays = 30 * duration
        const usedPlanDays = moment(new Date()).diff(purchase_date, 'days')
        const planExpiry = expireDays - usedPlanDays + 1
        if (planExpiry <= 0) {
            const error = {
                show: true,
                message: string.subscription.subscriptionExpire,
                title: string.subscription.subscriptionExpireTitle,
            }
            return {
                payload: { error, planExpireIn: null, subscriptionPlan: '' },
                type: CHECK_SUBSCRIPTION,
            }
        }
        const error = {
            show: false,
            message: '',
            title: '',
        }
        return { type: CHECK_SUBSCRIPTION, payload: { subscriptionPlan: plan, planExpireIn: planExpiry, error } }
    }

    const subscription = user?.organization?.subscription
    if (subscription) {
        const { duration, plan, purchase_date } = subscription
        if (plan) {
            if (plan === 'trial') {
                return checkTrialPlan(purchase_date)
            }
            return checkSubscribedPlan(duration, purchase_date, plan)
        }
    }
    const error = {
        show: true,
        message: string.subscription.subscriptionExpire,
        title: string.subscription.subscriptionExpireTitle,
    }
    return {
        payload: { error, planExpireIn: null, subscriptionPlan: '' },
        type: CHECK_SUBSCRIPTION,
    }
}

export const checkSubscriptionPlan = (user) => {
    // eslint-disable-next-line func-names
    return function (dispatch) {
        const payload = checkPlan(user)
        return dispatch(payload)
    }
}

export const closeSubscriptionPlan = () => {
    return {
        type: SUBSCRIPTION_CLOSED,
        payload: {
            message: '',
            title: '',
            show: false,
        },
    }
}

export const subscriptionDetails = (id) => async (dispatch) => {
    try {
        const response = await fetchDetails(id)
        if (response) {
            dispatch({
                type: SUBSCRIPTION_DETAILS,
                payload: response,
            })
        }
    } catch (err) {
        console.log({ err })
    }
}
