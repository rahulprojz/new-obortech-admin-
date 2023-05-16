import React, { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'

const SeoMetaData = dynamic(() => import('../SeoMetaData'), { ssr: false })

function Maintenance() {
    if (typeof window === 'undefined') {
        return null
    }

    // We need ref in this, because we are dealing
    // with JS setInterval to keep track of it and
    // stop it when needed
    const Ref = useRef(null)
    // The state for our timer
    const [timer, setTimer] = useState('00:00:00')

    const getTimeRemaining = (e) => {
        const total = Date.parse(e) - Date.parse(new Date())
        const seconds = Math.floor((total / 1000) % 60)
        const minutes = Math.floor((total / 1000 / 60) % 60)
        const hours = Math.floor((total / 1000 / 60 / 60) % 24)
        return {
            total,
            hours,
            minutes,
            seconds,
        }
    }

    const startTimer = (e) => {
        const { total, hours, minutes, seconds } = getTimeRemaining(e)
        if (total >= 0) {
            // update the timer
            // add '0' at the beginning of the variable
            setTimer(`${hours > 9 ? hours : `0${hours >= 0 ? hours : 0}`}:${minutes > 9 ? minutes : `0${minutes >= 0 ? minutes : 0}`}:${seconds > 9 ? seconds : `0${seconds >= 0 ? seconds : 0}`}`)
        }
    }

    const clearTimer = (e) => {
        setTimer('00:00:00')
        if (Ref.current) clearInterval(Ref.current)
        const id = setInterval(() => {
            startTimer(e)
        }, 1000)
        Ref.current = id
    }

    const getDeadTime = () => {
        const hours = 5
        const startingTime = '2022/07/14 17:00:00'
        // Need to give the starting time here
        const deadline = new Date(startingTime)
        deadline.setSeconds(deadline.getSeconds() + 60 * 60 * hours) // 28800 for 8 hours
        return deadline
    }

    useEffect(() => {
        getDeadTime()
        clearTimer(getDeadTime())
    }, [])

    return (
        <div className='text-center' style={{ marginTop: '20px' }}>
            <SeoMetaData meta_data={{ title: 'Temporarily down for maintenance' }} />
            <div className='align-items-center'>
                <img src='/static/img/logo.png' alt='OBORTECH' />
            </div>
            <h3 className='text-center' style={{ marginTop: '20px' }}>
                Temporarily down for maintenance
            </h3>
            <h5 className='text-center' style={{ marginTop: '20px' }}>
                Sorry for the inconvenience but we are performing some maintenance at the moment. We will be back in {timer} hours.
            </h5>
        </div>
    )
}
export default Maintenance
