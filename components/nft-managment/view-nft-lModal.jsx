import { Modal, ModalHeader, ModalBody } from 'reactstrap'
import string from '../../utils/LanguageTranslation'

function NftModal({ isOpen, toggle, nftTitle, nftImage, tokenId, polygonUrl, openUrl = '', qrCodeValue = '' }) {
    if (!openUrl && tokenId) {
        openUrl = `${process.env.OPENSEA_URL}/${process.env.CONTRACT_ADDRESS}/${tokenId}`
    }
    return (
        <Modal isOpen={isOpen} toggle={toggle} className='customModal' size='lg'>
            <ModalHeader toggle={toggle}></ModalHeader>
            <ModalBody>
                <div className='text-center font-weight-bold mt-n3 mb-3'>{string.nft.nftCreatedHeading}</div>
                <div className='container'>
                    <div class='row mr-4 pr-4'>
                        <div class='col-lg-4 ml-n5'>
                            <div className='col mb-4 pb-4'>
                                <div>{string.nft.item}</div>
                                <div className='font-weight-bold mt-2'>{nftTitle}</div>
                            </div>
                            <div className='col'>
                                <div>{string.nft.nftName}</div>
                                <div className='font-weight-bold mt-2'>{nftTitle}</div>
                            </div>
                        </div>
                        <div class='col-lg-4 ob-nft-middle-col-created'>
                            <div className='col'>
                                <div className='align-items-center'>{string.nft.nftPolygon}</div>
                                <div className='col pl-0 test-class' style={{ wordWrap: 'break-word' }}>
                                    <a href={polygonUrl} target='_blank'>
                                        {polygonUrl}
                                    </a>
                                </div>
                            </div>
                            <div className='col mt-4'>{string.nft.nftOpensea}</div>
                            <div className='col test-class' style={{ wordWrap: 'break-word' }}>
                                <a href={openUrl} target='_blank'>
                                    {openUrl}
                                </a>
                            </div >
                            <div className='col mt-4'>{string.nft.nftSmartHub}</div>
                            <div className='col text-danger'>{qrCodeValue}</div>
                        </div >
                        <div class='col-lg-4 '>
                            <div className='col'>
                                <img src={nftImage} height={'190px'} width={'190px'} alt='OBORTECH' />
                            </div>
                            <div className='col mt-4 ml-5'>{string.nft.nftPicture}</div>
                        </div>
                    </div >
                </div >
            </ModalBody >
        </Modal >
    )
}

export default NftModal
