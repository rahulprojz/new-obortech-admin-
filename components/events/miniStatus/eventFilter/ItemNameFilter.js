import React, { useCallback, useContext, useEffect, useState } from 'react'
import Card from 'react-bootstrap/Card'
import Select from 'react-select'
import { useCookies } from 'react-cookie'
import notify from '../../../../lib/notifier'
import EventContext from '../../../../store/event/eventContext'
import ItemAddEditContext from '../../../../store/event/itemAddEditContext'
import useEventSelectOptionsGroup from '../../../../utils/customHooks/useEventSelectOptionsGroup'
import { dynamicLanguageStringChange } from '../../../../utils/globalFunc'
import { addNftImage, createNft } from '../../../../lib/api/nft'
import { fetchItemPublicProjectEvents } from '../../../../lib/api/project-event'
import { fetchItem } from '../../../../lib/api/item'
import string from '../../../../utils/LanguageTranslation'
import CreateNft from './createNftModal'
import QrCodeContext from '../../../../store/event/qrCodeContext'
import NftModal from '../../../nft-managment/view-nft-lModal'
import { Popover, OverlayTrigger, Button } from 'react-bootstrap'

const ItemNameFilter = ({ isPublicUser = false, project, userLogged, customStyles, dropDownStyle, showQrCode, isManager }) => {
    const { itemsNames, dispatchItemsNames, filterProjectSelection, updateAllStateAvailable, clearAllSelections, filterParentsDependancy, labels, getSelection } = useContext(EventContext)
    const { setModal, setOperation, operator } = useContext(ItemAddEditContext)
    const [openOption, setOpenOption] = useState(false)
    const [openCreatedModal, setOpenCreatedModal] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [file, setFile] = useState('')
    const [cookies, _] = useCookies()
    const [polygoneUrl, setPolygoneUrl] = useState('')
    const [openSeaUrl, setOpenSeaUrl] = useState('')
    const [createNftLoading, setCreateNftLoading] = useState(false)
    const [QRCode, setQRCode] = useState('')

    // const { qrCodeValue } = useContext(QrCodeContext)

    const handleOption = () => {
        setOpenOption(!openOption)
    }

    const imageToObjectConvertor = async (url) => {
        // code for converting "image source" (url) to "Base64"
        const toDataURL = (url) =>
            fetch(url)
                .then((response) => response.blob())
                .then(
                    (blob) =>
                        new Promise((resolve, reject) => {
                            const reader = new FileReader()
                            reader.onloadend = () => resolve(reader.result)
                            reader.onerror = reject
                            reader.readAsDataURL(blob)
                        }),
                )

        //  code for converting "Base64" to javascript "File Object"

        function dataURLtoFile(dataurl, filename) {
            var arr = dataurl.split(','),
                mime = arr[0].match(/:(.*?);/)[1],
                bstr = atob(arr[1]),
                n = bstr.length,
                u8arr = new Uint8Array(n)
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n)
            }
            return new File([u8arr], filename, { type: mime })
        }

        // *** Calling both function ***

        const imageObject = await toDataURL(url).then((dataUrl) => {
            const fileData = dataURLtoFile(dataUrl, 'imageName.png')
            return fileData
        })
        return imageObject
    }

    const handleNftModal = async () => {
        handleOption()
        setFile('/static/img/nft-default-image1.png')
        if (itemsNames?.selected?.value) {
            const allEvents = await fetchItemPublicProjectEvents({ item_id: itemsNames.selected.value })
            if (allEvents.length === 0) {
                notify(string.nft.noPublicEvent)
                return
            }
            let url = '/static/img/nft-default-image1.png'
            const imageObj = await imageToObjectConvertor(url)
            const fileExtension = 'png'
            const formData = new FormData()
            formData.append('file', imageObj)
            formData.append('fileName', imageObj.name)
            formData.append('itemName', itemsNames?.selected?.label)
            formData.append('unique_id', userLogged.unique_id)
            formData.append('fileType', fileExtension)
            const textOnImage = addNftImage(formData).then((res) => {
                if (res.code == 200) {
                    setFile(res.imgURL + '?id=' + Math.random())
                }
            })

            setIsOpen(true)
        } else {
            notify(dynamicLanguageStringChange(string.container.pleaseSelectItem, labels))
        }
    }
    const handleNftModalToggle = () => {
        setIsOpen((prevState) => !prevState)
    }

    const handleCreateNftToggle = () => {
        setOpenCreatedModal((prevState) => !prevState)
    }

    const handleEditItem = useCallback(() => {
        handleOption(false)
        if (itemsNames?.selected?.value) {
            setOperation(operator.EDIT)
            setModal(true)
        } else {
            notify(dynamicLanguageStringChange(string.container.pleaseSelectItem, labels))
        }
    }, [openOption])

    const filterOtherSelection = () => {
        if (project?.project_selections && project?.project_selections.length > 0 && itemsNames.selected) {
            const selectionFiltration = project.project_selections.filter(filterProjectSelection)
            updateAllStateAvailable(selectionFiltration, 'item')
            if (itemsNames.selected.value && selectionFiltration.length) {
                filterParentsDependancy(project.project_selections, selectionFiltration)
            }
        }
    }
    useEffect(() => {
        filterOtherSelection()
    }, [itemsNames.selected])

    useEffect(() => {
        dispatchItemsNames({
            type: 'updateAvailable',
            payload: { available: useEventSelectOptionsGroup(project?.project_selections, 'selection_items') },
        })
        getSelection('item')
        filterOtherSelection()
    }, [project])

    useEffect(() => {
        dispatchItemsNames({
            type: 'initialize',
            payload: { available: useEventSelectOptionsGroup(project.project_selections, 'selection_items') },
        })
    }, [])

    const handleCreateNft = async () => {
        setCreateNftLoading(true)
        const formData = new FormData()
        var imageFile = await imageToObjectConvertor(file)
        const allEvents = await fetchItemPublicProjectEvents({ item_id: itemsNames.selected.value })
        const itemDetails = await fetchItem({ id: itemsNames.selected.value })
        formData.append('unique_id', userLogged.unique_id)
        formData.append('orgName', userLogged.organization.blockchain_name)
        formData.append('name', itemsNames?.selected?.label)
        formData.append('description', 'Obortech NFT for item ' + itemsNames?.selected?.label)
        formData.append('metaData', JSON.stringify(allEvents))
        formData.append('file', imageFile)
        formData.append('item_code', itemDetails.qr_code)
        setQRCode(itemDetails.qr_code)

        const createNftRes = await createNft(formData, cookies.authToken)
        if (createNftRes.response.status == 200) {
            setIsOpen(false)
            setOpenCreatedModal(true)
        }
        setPolygoneUrl(createNftRes.data.polygonUrl)
        setOpenSeaUrl(createNftRes.data.openSeaUrl)
        setCreateNftLoading(false)
    }

    const availables = itemsNames.available.map((item) => ({ ...item, label: dynamicLanguageStringChange(item.label, labels) }))
    const selected = { value: itemsNames.selected?.value, label: dynamicLanguageStringChange(itemsNames.selected?.label, labels) }
    return (
        <div style={{ width: '196px' }} id='itemNameSelect'>
            <div className='row justify-content-center align-items-center'>
                <div style={dropDownStyle}>
                    <Select
                        options={availables}
                        styles={customStyles}
                        value={selected}
                        isDisabled={isPublicUser}
                        onChange={(selectedOption) => {
                            clearAllSelections('item')
                            window.localStorage.setItem(`${project.id}_selection`, JSON.stringify({ item: selectedOption }))
                            dispatchItemsNames({ type: 'onSelect', payload: { selected: selectedOption } })
                        }}
                    />
                </div>
                {showQrCode == 'show' && (userLogged.role_id == process.env.ROLE_ADMIN || userLogged.role_id == process.env.ROLE_MANAGER) && (
                    <div id='nft-asset-1' onClick={handleOption} style={{ width: '20px', cursor: 'pointer', position: 'relative', marginRight: '13px' }}>
                        <div className='row '>
                            <OverlayTrigger
                                trigger='click | focus | hover'
                                placement='right'
                                rootClose
                                show={openOption}
                                onToggle={(option) => {
                                    handleOption(option)
                                }}
                                overlay={
                                    <Popover id={'nft-asset-1'} style={{ padding: 0 }}>
                                        <Popover.Content style={{ padding: 0, margin: 0 }}>
                                            <div className='ob-div-card'>
                                                <div className='ob-iot-option' onClick={handleEditItem}>
                                                    {string.nft.iotOption}
                                                </div>
                                                {isManager && (
                                                    <div className='ob-nft-option' onClick={handleNftModal}>
                                                        {string.nft.nftOption}
                                                    </div>
                                                )}
                                            </div>
                                        </Popover.Content>
                                    </Popover>
                                }
                            >
                                <div style={{ width: 0, position: 'absolute', top: '50%', left: '90%' }}></div>
                            </OverlayTrigger>
                            <div className='col'>
                                {' '}
                                <i className='fas fa-ellipsis-v'></i>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <CreateNft isOpen={isOpen} toggle={handleNftModalToggle} itemName={itemsNames?.selected?.label} user={userLogged} file={file} setFile={setFile} handleCreateNft={handleCreateNft} createNftLoading={createNftLoading} />
            <NftModal isOpen={openCreatedModal} toggle={handleCreateNftToggle} nftTitle={itemsNames?.selected?.label} nftImage={file} tokenId polygonUrl={polygoneUrl} openUrl={openSeaUrl} qrCodeValue={QRCode} />
        </div>
    )
}

export default ItemNameFilter
