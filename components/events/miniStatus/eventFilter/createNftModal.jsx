import { Modal, ModalHeader, ModalBody } from 'reactstrap'
import { useState, useEffect } from 'react'
import LoaderButton from '../../../common/form-elements/button/LoaderButton'
import notify from '../../../../lib/notifier'
import string from '../../../../utils/LanguageTranslation'
import { addNftImage } from '../../../../lib/api/nft'
import Loader from '../../../../components/common/Loader'

function CreateNft({ isOpen, toggle, itemName, user, file, setFile, handleCreateNft, createNftLoading }) {
    const [isLoading, setISLoading] = useState(false)
    const [imgHeight, setImgHeight] = useState()
    const [imgWidth, setImgWidth] = useState()
    // const [fileSizeCheck, setFileSizeCheck] = useState(true)
    const hiddenFileInput = React.useRef(null)
    const handleFileUpload = (e) => {
        hiddenFileInput.current.click()
    }
    const handleChange = async (event) => {
        let fileSizeCheck = true
        const fileUploaded = event.target.files[0]
        //Initiate the FileReader object.
        var reader = new FileReader();
        //Read the contents of Image File.
        reader.readAsDataURL(event.target.files[0]);
        reader.onload = function (e) {
            //Initiate the JavaScript Image object.
            var image = new Image();
            //Set the Base64 string return from FileReader as source.
            image.src = e.target.result;

            //Validate the File Height and Width.
            image.onload = async function () {
                var height = this.height;
                var width = this.width;
                if (height != 350 || width != 350) {
                    fileSizeCheck = false
                    notify(string.nft.imageHeightWidth)
                    setISLoading(false)

                }
                else {
                    fileSizeCheck = true
                }
                fileSizeCheck && await checkFileType(fileUploaded)
            };
        }

    }
    const checkFileType = async (fileUploaded) => {
        setISLoading(true)
        if (fileUploaded.size < 1000000) {
            const fileExtension = fileUploaded.name.split('.').at(-1)
            const allowedFileTypes = ['jpg', 'png', 'jpeg', 'gif']
            if (!allowedFileTypes.includes(fileExtension)) {
                notify(string.nft.invalidFileType)
                setISLoading(false)
            } else {
                const img = new Image()
                img.src = file
                setImgHeight(img.height)
                setImgWidth(img.width)

                // imgHeight ==230, imgWidth==230
                const obj = new File([fileUploaded], `${fileUploaded.name}`, {
                    type: 'application/img',
                })
                const formData = new FormData()
                formData.append('file', obj)
                formData.append('fileName', obj.name)
                formData.append('itemName', itemName)
                formData.append('unique_id', user.unique_id)
                formData.append('fileType', fileExtension)
                const imageManipulation = await addNftImage(formData)

                if (imageManipulation.code == 200) {
                    setFile(imageManipulation.imgURL + '?id=' + Math.random())
                    setISLoading(false)
                }
            }
        } else {
            setISLoading(false)
            notify(string.nft.fileLessThan)
        }
    }

    return (
        <Modal isOpen={isOpen} toggle={toggle} className='customModal' size='lg'>
            <ModalHeader toggle={toggle}>
                <ModalBody style={{ textTransform: 'none' }}>{string.nft.createNftHeading}</ModalBody>
            </ModalHeader>
            <ModalBody>
                <div className='container' style={{ position: 'relative' }}>
                    <div class='row mr-4 pr-4'>
                        <div class='ml-n5 col-lg-4'>
                            <div className='col mb-4 pb-4'>
                                <div className='mt-2'>{string.nft.item}</div>
                                <div className='font-weight-bold pt-1'>{itemName}</div>
                            </div>
                            <div className='col'>
                                <div className='mt-2'>{string.nft.nftName}</div>
                                <div className='font-weight-bold pt-1'>{itemName}</div>
                            </div>
                        </div>
                        <div className='ob-nft-spinner'>{isLoading ? <Loader className='pagination-loader ' /> : ''}</div>
                        <div class='col-lg-4 ob-nft-middle-col'>
                            <div className=' mt-3 text-center'>{string.nft.pictureFormatePara}</div>
                            <div className='mt-n1 text-center'>{string.nft.imageType}</div>
                            <div className='col mt-3 text-center'>{string.nft.imageSize}</div>
                            <div className='col mt-n1 text-center'>{string.nft.imagePixel}</div>
                            <div className='col mt-4 text-center'>
                                <LoaderButton isLoading={createNftLoading} text={string.nft.createBtn} onClick={handleCreateNft} />
                            </div>
                        </div>
                        <div class='col-lg-4 '>
                            <div className='col'>
                                <img src={file} width={'190px'} alt='OBORTECH' />
                            </div>
                            <div className=' '>
                                <button className={createNftLoading ? 'ob-change-btn-disabled' : 'ob-change-picture-btn'} onClick={handleFileUpload} disabled={createNftLoading}>
                                    {string.nft.changePictureBtn}
                                </button>

                                <input type='file' style={{ display: 'none' }} ref={hiddenFileInput} onChange={handleChange} />
                            </div>
                        </div>
                    </div>
                </div>
            </ModalBody>
        </Modal>
    )
}

export default CreateNft
