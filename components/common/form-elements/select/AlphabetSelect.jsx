import React, { useState } from 'react'
import { Popover, OverlayTrigger, Button } from 'react-bootstrap'
import './Select.css'

const cyrillicAlphabets = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ё', 'Ж', 'З', 'И', 'Й', 'К', 'Л', 'М', 'Н', 'О', 'Ө', 'П', 'Р', 'С', 'Т', 'У', 'Ү', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ', 'Ы', 'Ь', 'Э', 'Ю', 'Я']

const AlphabetSelect = (props) => {
    const { name, from, value, onSelect } = props
    const [searchText, setSearchText] = useState('')

    const buttons = cyrillicAlphabets
        .filter((cyrillic) => (searchText ? searchText == cyrillic : true))
        .map((cyrillic, index) => (
            <Button
                key={index}
                variant={cyrillic === value ? 'primary' : 'outline-light'}
                className='text-dark border border-secondary bg-light lang-btn'
                onClick={() => {
                    onSelect(cyrillic)
                    document.body.click()
                }}
            >
                {cyrillic}
            </Button>
        ))
    return (
        <OverlayTrigger
            trigger='click'
            placement='top'
            rootClose
            overlay={
                <Popover id={name}>
                    <Popover.Content>
                        <div className='lang-alphabet-cont'>
                            <input autoFocus name='searchText' type='text' className='w-100' value={searchText} onChange={(e) => setSearchText(e.target.value)} />
                            {buttons}
                        </div>
                    </Popover.Content>
                </Popover>
            }
        >
            <Button variant='info' className={`${from === 'profile' ? 'mt-0 mr-3 heightfix ' : ''}text-dark border border-secondary bg-light btn btn-outline-light lang-trigger`}>
                {value}
                <i className='fa fa-chevron-down ml-2' />
            </Button>
        </OverlayTrigger>
    )
}

export default AlphabetSelect
