import React from 'react'
import Styled from 'styled-components'
import { Spinner } from 'reactstrap'

const Container = Styled.div`
width: 100%;
height: 100%;
display: flex;
align-items: center;
justify-content: center;
z-index: 999;
overflow: hidden;
`

const Loader = (props) => {
    return (
        <Container {...props}>
            <Spinner size='lg' />
        </Container>
    )
}

export default Loader
