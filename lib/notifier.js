import { openSnackbar } from '../components/Notifier';

export default function notify(obj) {
    openSnackbar({ message: obj ? obj.message || obj.toString() : '' })
}
