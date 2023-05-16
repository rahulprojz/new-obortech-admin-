import Link from 'next/link'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { TRACK_ITEM_PAGE } from '../../components/header/Config'
import { setTrackItemDetail } from '../../redux/actions/publicUser'
import { _momentGetDiff } from '../../utils/globalFunc'
import string from '../../utils/LanguageTranslation'

const MiniStats = ({ isPublicUser, project_id, selectedItemValue, selectedDeviceValue,latestStats, hum_alert, temp_alert }) => {
    const dispatch = useDispatch()
    const link = '/analytics/' + project_id + '/' + (selectedItemValue || 0) + '/' + (selectedDeviceValue || 0)

    const handleTrackDetail = useCallback(() => {
        dispatch(
            setTrackItemDetail({
                projectId: project_id,
                itemId: selectedItemValue || 0,
                deviceId: selectedDeviceValue || 0,
                page: TRACK_ITEM_PAGE.ANALYTICS,
            }),
        )
    }, [project_id, selectedItemValue, selectedDeviceValue])

    return (
        <div className='stats-wrapper row m-0'>
            <div className='col-sm-6 br-0 bb-0'>
                {isPublicUser ? (
                    <a style={{ cursor: 'pointer' }} onClick={handleTrackDetail}>
                        <p className='title'>{string.chart.Humidity}</p>
                    </a>
                ) : (
                    <Link href={link}>
                        <a>
                            <p className='title'>{string.chart.Humidity}</p>
                        </a>
                    </Link>
                )}
                <p className='output'>
                    <span className='green-text'>{latestStats?.latestHum?.toString()}%</span>
                    &nbsp;
                    {hum_alert > 0 ? <span className='text-red'>({hum_alert})</span> : ''}
                </p>
            </div>
            <div className='col-sm-6 bb-0'>
                {isPublicUser ? (
                    <a onClick={handleTrackDetail} style={{ cursor: 'pointer' }}>
                        <p className='title'>{string.chart.Temperature}</p>
                    </a>
                ) : (
                    <Link href={link}>
                        <a>
                            <p className='title'>{string.chart.Temperature}</p>
                        </a>
                    </Link>
                )}
                <p className='output'>
                    <span className='green-text'>{latestStats?.latestTemp?.toString()}°C</span>
                    &nbsp;
                    {temp_alert > 0 ? <span className='text-red'>({temp_alert})</span> : ''}
                </p>
            </div>
            <div className='col-sm-6 br-0'>
                <p className='title'>{string.sealing}</p>
                <p className='output'>
                    <span className={latestStats?.sealingOpenCount > 0 ? 'text-red' : 'green-text'}>
                        {latestStats?.sealingOpenCount?.toString()} {string.opened}
                    </span>
                </p>
            </div>
            <div className='col-sm-6'>
                <p className='title'>{string.smartLoack}</p>
                <p className='output'>
                    <a>
                        <p className='title'>{string.chart.tamper}</p>
                    </a>
                    <span className={latestStats?.latestTamper|| latestStats?.latestTamper === null ? 'green-text' : 'text-red'}>
                        {latestStats.latestTamper === null && string.na}
                        {latestStats.latestTamper === false && `${string.tamper.iotDetach} (${latestStats.latestTamperCount})`}
                        {latestStats.latestTamper && `${string.tamper.iotAttach} (${latestStats.latestTamperCount})`}
                    </span>
                </p>
            </div>
        </div>
    )
}

export default MiniStats