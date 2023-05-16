import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'

import string from '../../../utils/LanguageTranslation.js'

const GenerateGithubTokenSteps = ({ isOpen, onToggle }) => {
    if (typeof window === 'undefined') {
        return null
    }
    return (
        <Modal isOpen={isOpen} onToggle={onToggle} className='customModal document ob-min-w700'>
            <ModalHeader onToggle={onToggle}>
                <span className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                    {string.githubSetupSteps.header}
                </span>
            </ModalHeader>
            <ModalBody>
                <ul>
                    <li>
                        {string.githubSetupSteps.step1}{' '}
                        <a href={'https://github.com/'} target='_blank'>
                            https://github.com/
                        </a>
                    </li>
                    <li>
                        {string.githubSetupSteps.step2}{' '}
                        <a href={'https://github.com/settings/tokens'} target='_blank'>
                            https://github.com/settings/tokens
                        </a>
                    </li>
                    <li>{string.githubSetupSteps.step3}</li>
                    <li>
                        {string.githubSetupSteps.step4}
                        <img style={{ maxWidth: '450px' }} src='/static/img/onboarding/githubSteps-white.png' className='pt-2 pb-2' />
                    </li>
                    <li>{string.githubSetupSteps.step5}</li>
                    <li>{string.githubSetupSteps.step6}</li>
                </ul>
            </ModalBody>
            <ModalFooter>
                <button className='btn btn-primary' onClick={onToggle}>
                    Close
                </button>
            </ModalFooter>
        </Modal>
    )
}

GenerateGithubTokenSteps.propTypes = {}
GenerateGithubTokenSteps.defaultProps = {}

export default GenerateGithubTokenSteps
