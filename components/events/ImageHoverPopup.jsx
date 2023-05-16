import { useEffect, useState } from 'react'
import { Tooltip } from 'reactstrap'
import { fetchImageBase } from '../../lib/api/project-event'
import Loader from '../common/Loader'

const ImageHoverPopup = ({ id, project_event, positionTop, openTooltip, setOpenTooltip }) => {
    const [attachment, setAttachment] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isA4, setIsA4] = useState(false)
    const getAttachment = async (id) => {
        setIsLoading(true)
        const response = await fetchImageBase({ id: project_event.event_submission_id })
        const img = new Image()
        img.onload = () => {
            setIsA4(img.height >= '1100' && img.width >= '800')
            setAttachment(response.image_base)
            setIsLoading(false)
        }
        img.src = !!response.image_base && response.image_base.includes('data:') ? response.image_base : `data:image/jpeg;base64,${response.image_base}`
    }

    useEffect(() => {
        getAttachment(id)
    }, [id])

    return (
        <>
            {isLoading && (
                <Tooltip
                    isOpen={isLoading}
                    autohide={false}
                    placement='left'
                    placementPrefix={isA4 ? `document-attach-a4  bs-tooltip` : 'document-attach bs-tooltip'}
                    target={`document-attached-${id}`}
                    toggle={() => {
                        setIsLoading(false)
                    }}
                >
                    <div className={`obt-img-hover-tb ${isA4 ? `obt-img-hover-tb-A4 ${positionTop >= 0 && 'obt-img-hover-tb-A4-top'}  ${positionTop < 0 && 'obt-img-hover-tb-A4-bottom'}` : ''}`}>
                        <Loader style={{ color: 'black' }} />
                    </div>
                </Tooltip>
            )}
            {!isLoading && (
                <Tooltip
                    isOpen={openTooltip}
                    autohide={false}
                    placement='left'
                    placementPrefix={isA4 ? `document-attach-a4  bs-tooltip` : 'document-attach bs-tooltip'}
                    target={`document-attached-${id}`}
                    toggle={() => {
                        setOpenTooltip(false)
                    }}
                >
                    <div className={`obt-img-hover-tb ${isA4 ? `obt-img-hover-tb-A4 ${positionTop >= 0 && 'obt-img-hover-tb-A4-top'}  ${positionTop < 0 && 'obt-img-hover-tb-A4-bottom'}` : ''}`}>
                        <div>{attachment && <img style={{ width: '100%' }} src={!!attachment && attachment.includes('data:') ? attachment : `data:image/jpeg;base64,${attachment}`} />}</div>
                    </div>
                </Tooltip>
            )}
        </>
    )
}

export default ImageHoverPopup
