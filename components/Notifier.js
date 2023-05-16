import React from 'react'
import SweetAlert from 'react-bootstrap-sweetalert'

let openSnackbarFn

class Notifier extends React.Component {
    state = {
        open: false,
        message: '',
    }

    componentDidMount() {
        openSnackbarFn = this.openSnackbar
    }

    handleSnackbarClose = () => {
        this.setState({
            open: false,
            message: '',
        })
    }

    openSnackbar = ({ message }) => {
        this.setState({ open: true, message })
    }

    render() {
        const { open, message } = this.state
        const msg = <span id='snackbar-message-id' dangerouslySetInnerHTML={{ __html: message }} />

        return open ? (
            <SweetAlert onConfirm={this.handleSnackbarClose} onCancel={this.handleSnackbarClose} title='' style={{ overflow: 'auto', maxHeight: '450px', left: '50.9%' }} confirmBtnStyle={{ height: '35px' }} btnSize='md'>
                {msg}
            </SweetAlert>
        ) : null
    }
}

export function openSnackbar({ message }) {
    openSnackbarFn({ message })
}

export default Notifier
