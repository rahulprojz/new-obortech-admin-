import { SET_SIDEBAR_MENU_LIST, REMOVE_PROJECT_FROM_MENU_LIST } from '../types'

const initialState = {
    menuList: [],
}

export const sidebarReducer = (state = initialState, { type, payload }) => {
    switch (type) {
        case SET_SIDEBAR_MENU_LIST: {
            return {
                ...state,
                menuList: payload && payload.length ? payload : [],
            }
        }
        case REMOVE_PROJECT_FROM_MENU_LIST: {
            const tempList = []
            for (const menu of state.menuList) {
                tempList.push({ ...menu, projects: menu.projects.filter((proj) => proj.id != payload) })
            }
            return {
                ...state,
                menuList: tempList,
            }
        }
        default:
            return state
    }
}
