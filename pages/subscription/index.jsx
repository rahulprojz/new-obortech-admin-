import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import moment from 'moment'
import { subscriptionDetails } from '../../redux/actions/subscriptionAction'
import { deviceDetails } from '../../redux/actions/deviceActions'
import withAuth from '../../lib/withAuth'
import string from '../../utils/LanguageTranslation'
import Loader from '../../components/common/Loader'
import '../../static/css/common.css'

function Index({ user }) {
    const dispatch = useDispatch()
    const [renderComponent, setRenderComponent] = useState('loading')
    const subscription = useSelector((state) => state.subscription.subscriptionDetails)
    const device = useSelector((state) => state.device.deviceCounts)
    useEffect(() => {
        const organization = user?.organization
        const subscriptionRef = organization?.subscription
        if (subscriptionRef && subscriptionRef.id) {
            dispatch(subscriptionDetails(subscriptionRef.id))
            dispatch(deviceDetails(organization.id))
        } else {
            setRenderComponent('subscriptionNotExist')
        }
    }, [])

    useEffect(() => {
        subscription?.counts && setRenderComponent('subscriptionInfo')
    }, [subscription.counts])

    const subscriptionNotExist = () => {
        return (
            <div className='d-flex justify-content-center'>
                <p>You doesn't have any subscription.</p>
            </div>
        )
    }

    const subscriptionInfo = () => {
        const endDateRef = moment(subscription?.subscriptionInfo?.purchase_date).add(30, 'days').calendar()
        const endDate = moment(endDateRef).format('lll')
        return (
            <>
                <div className='container-fluid'>
                    <div className='row d-flex project-listing'>
                        <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 event-filter '>
                            <h4 className='text-dark'> {string.subscription.subscriptionDetails}</h4>
                        </div>
                        <div className='row mr-0'>
                            <div className='col-md-6 p-1'>
                                <label htmlFor='smartContractName' className='col-md-6 col-form-label pr-1 pl-0'>
                                    {string.subscription.subscriptionId} :
                                </label>
                                <label htmlFor='smartContractName' className='col-md-6 col-form-label pr-1'>
                                    {subscription.subscriptionInfo ? subscription.subscriptionInfo.id : '---'}
                                </label>
                            </div>
                            <div className='col-md-6 p-1'>
                                <label htmlFor='tag' className='col-md-6 col-form-label pr-1 pl-0'>
                                    {string.subscription.subscriptionStartDate} :
                                </label>
                                <label htmlFor='smartContractName' className='col-md-6 col-form-label pr-1'>
                                    {subscription.subscriptionInfo ? moment(subscription.subscriptionInfo.purchase_date).format('lll') : '---'}
                                </label>
                            </div>
                            <div className='col-md-6 p-1'>
                                <label htmlFor='tag' className='col-md-6 col-form-label pr-1 pl-0'>
                                    {string.subscription.subscriptionPlan} :
                                </label>
                                <label htmlFor='smartContractName' className='col-md-6 col-form-label pr-1'>
                                    {subscription.subscriptionInfo ? subscription.subscriptionInfo.plan : '---'}
                                </label>
                            </div>
                            <div className='col-md-6 p-1'>
                                <label htmlFor='tag' className='col-md-6 col-form-label pr-1 pl-0'>
                                    {string.subscription.subscriptionEndDate}:
                                </label>
                                <label htmlFor='smartContractName' className='col-md-6 col-form-label pr-1'>
                                    {subscription.subscriptionInfo ? endDate : '---'}
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='container-fluid'>
                    <div className='row d-flex project-listing'>
                        <div className='tab-content w-100' id='myTabContent'>
                            <div className='tab-pane fade show active mt-3 w-100' id='devices' role='tabpanel' aria-labelledby='device-listing'>
                                <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 event-filter '>
                                    <h4 className='text-dark'>{string.subscription.planDetails}</h4>
                                </div>
                                <div className='project-table-listing table-responsive mt-2 w-100'>
                                    <table className='table'>
                                        <thead className='thead-dark'>
                                            <tr>
                                                <th scope='col'>#</th>
                                                <th scope='col'>{string.subscription.planInclusions}</th>
                                                <th scope='col'>{string.subscription.subscriptionCredits}</th>
                                                <th scope='col'>{string.subscription.subscriptionCFCredits}</th>
                                                <th scope='col'>{string.subscription.totalCredits}</th>
                                                <th scope='col'>{string.subscription.usedCredits}</th>
                                                <th scope='col'>{string.subscription.remainingCredits}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {subscription.counts &&
                                                subscription.counts.map(({ name, creditCount, carryForwardCount, debitCounts }, i) => {
                                                    return (
                                                        <tr key={i}>
                                                            <td>{i + 1}</td>
                                                            <td>{name}</td>
                                                            <td>{creditCount || 0}</td>
                                                            <td>{carryForwardCount || 0}</td>
                                                            <td>{creditCount + carryForwardCount || 0}</td>
                                                            <td>{debitCounts}</td>
                                                            <td>{creditCount + carryForwardCount - debitCounts}</td>
                                                        </tr>
                                                    )
                                                })}
                                            {/* <NoDataView list={paginationData.list} isLoading={isLoading} /> */}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='container-fluid'>
                    <div className='row d-flex project-listing'>
                        <div className='tab-content w-100' id='myTabContent'>
                            <div className='tab-pane fade show active mt-3 w-100' id='devices' role='tabpanel' aria-labelledby='device-listing'>
                                <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 event-filter '>
                                    <h4 className='text-dark'>{string.subscription.deviceDetails}</h4>
                                </div>
                                <div className='project-table-listing table-responsive mt-2 w-100'>
                                    <table className='table'>
                                        <thead className='thead-dark'>
                                            <tr>
                                                <th scope='col'>#</th>
                                                <th scope='col'>{string.device.deviceName}</th>
                                                <th scope='col'>{string.device.totalCredits}</th>
                                                <th scope='col'>{string.device.usedCredits}</th>
                                                <th scope='col'>{string.device.remainingCredits}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {device &&
                                                device.map(({ device_id, creditCounts, carryForwardCount, debitCounts }, i) => {
                                                    return (
                                                        <tr key={i}>
                                                            <td>{i + 1}</td>
                                                            <td>{device_id}</td>
                                                            <td>{creditCounts || 0}</td>
                                                            <td>{debitCounts}</td>
                                                            <td>{creditCounts - debitCounts}</td>
                                                        </tr>
                                                    )
                                                })}
                                            {/* <NoDataView list={paginationData.list} isLoading={isLoading} /> */}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )
    }

    if (renderComponent === 'subscriptionNotExist') {
        return subscriptionNotExist()
    }

    if (renderComponent === 'subscriptionInfo') {
        return subscriptionInfo()
    }
    return <Loader className='pagination-loader' />
}

export default withAuth(Index, { loginRequired: true })
