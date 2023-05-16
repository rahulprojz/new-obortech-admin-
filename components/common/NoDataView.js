import string from '../../utils/LanguageTranslation.js'

const NoDataView = ({ list = [], isLoading = false, colSpan = 5 }) => {
    return !list.length && !isLoading ? (
        <tr>
            <td colSpan={colSpan} className='text-center'>
                {string.noData}
            </td>
        </tr>
    ) : null
}

export default NoDataView
