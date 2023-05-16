import { useState } from 'react'
import Card from 'react-bootstrap/Card'
import NftMOdal from './view-nft-lModal'
import {getItemCode} from '../../lib/api/item'

const NftCard = ({ nftTitle, nftImage, tokenId, polygonUrl }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [QRCode,setQRCode]=useState('')
    const handleModalToggle = () => {
        setIsOpen((prevState) => !prevState)
    }
    const clickHandler = async ()=>{
        setIsOpen(true)
        const getitems = await getItemCode({itemID:nftTitle});
        if(getitems){setQRCode(getitems.qr_code)}
    }
    const myStyle = {
        width: '100%',
    }
    return (
        <>
            <Card className='ob-nft-card' onClick={clickHandler}>
                <Card.Img className='ob-nft-card-img' variant='top' src={nftImage} height={230} style={myStyle} />
                <Card.Body>
                    <>{nftTitle}</>
                </Card.Body>
            </Card>

            <NftMOdal isOpen={isOpen} toggle={handleModalToggle} nftTitle={nftTitle} nftImage={nftImage} tokenId={tokenId} polygonUrl={polygonUrl} qrCodeValue={QRCode} />
        </>
    )
}

export default NftCard
