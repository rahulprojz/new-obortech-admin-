import { v4 as uuidV4 } from 'uuid'

export default uniqId = () => uuidV4().split('-')?.[0]?.toUpperCase()
