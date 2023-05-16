import { Spinner } from 'reactstrap'
import string from '../../utils/LanguageTranslation.js'
import ActionButton from '../../components/common/ActionButton'
import IntegrityIcon from '../../components/common/IntegirityIcon'

function List({ policies, is_fetching_policies, openAddModal, openDeleteModal, handleIntegrity, activeIntegerity, handleSort }) {
    const handleIntegrityCheck = (policy) => {
        let integrityIcon = `fa fa-refresh`
        if (activeIntegerity?.id === policy?.id) {
            integrityIcon = 'fas fa-sync fa-spin'
        }
        if (activeIntegerity !== null && activeIntegerity?.id !== policy?.id) {
            integrityIcon = 'fa fa-refresh text-muted disable'
        }
        return integrityIcon
    }

    return (
        // eslint-disable-next-line react/jsx-filename-extension
        <table className='table'>
            <thead className='thead-dark'>
                <tr>
                    <th scope='col'>#</th>
                    <th scope='col'>{string.datapurpose}</th>
                    <th scope='col'>{string.dataclause}</th>
                    <th scope='col' className='text-center' role='button' onClick={() => handleSort('integrity_status')}>
                        {string.audit.title}
                        <i className='fa fa-sort ml-2' aria-hidden='true' />
                    </th>
                    <th className='text-center' scope='col'>
                        {string.actions}
                    </th>
                </tr>
            </thead>
            <tbody>
                {policies.length > 0 &&
                    policies.map((policy, i) => {
                        const integrityIcon = handleIntegrityCheck(policy)
                        if (policy) {
                            return (
                                <tr key={i}>
                                    <td>{i + 1}</td>
                                    <td>{policy.request_purpose.purpose_value}</td>
                                    <td>{policy.clause}</td>
                                    <td className='text-center'>
                                        <IntegrityIcon data={policy} />
                                    </td>
                                    <td>
                                        <ActionButton icon='fa fa-pencil-alt' title='Edit policy' onClick={() => openAddModal(policy)} />
                                        <ActionButton icon='fa fa-trash' title='Delete policy' onClick={() => openDeleteModal(policy)} />
                                        <ActionButton
                                            icon={integrityIcon}
                                            title='Check Integrity'
                                            onClick={() => {
                                                if (!activeIntegerity) {
                                                    handleIntegrity(policy)
                                                }
                                            }}
                                        />
                                    </td>
                                </tr>
                            )
                        }
                    })}
                {policies.length == 0 && !is_fetching_policies && (
                    <tr>
                        <td colSpan='5' className='text-center'>
                            {string.noData}
                        </td>
                    </tr>
                )}
                {is_fetching_policies && (
                    <tr className='text-center'>
                        <td colSpan='6'>
                            <Spinner size='sm' />
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    )
}

export default List
