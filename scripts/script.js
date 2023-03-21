const board = document.querySelector(".board")
const boardInv = document.querySelector(".board-inv")
const resetButton = document.querySelector(".reset-button")
const turnCellF = document.querySelector(".turn-cell.first-team")
const turnCellS = document.querySelector(".turn-cell.second-team")

const rowsBoard = 6
const columnsBoard = 7

const boardArray = new Array()
let actualTeam = 'first'

function createCells(element, classy, firstime = false) {
    element.innerHTML = ''

    // Cria as células
    for (let r = 0; r < rowsBoard; r++) {
        for (let c = 0; c < columnsBoard; c++) {
            element.innerHTML += `<div class="${classy}${isFill(r, c)}" data-cell-row="${r}" data-cell-col="${c}"></div>`
        }

        function isFill(row, col) {
            if (boardArray[row][col] === 'f') return ' first-team'
            if (boardArray[row][col] === 's') return ' second-team'

            return ''
        }

    }
    
    if (firstime && checkWin(true)) board.classList.add('win')

    //Ajeita a grid para que fique do tamanho certo
    element.style.gridTemplateColumns = `repeat(${columnsBoard}, 1fr)`
    element.style.gridTemplateRows = `repeat(${rowsBoard}, 1fr)`
}

function setArray(firstTime = false) {
    const localArray = JSON.parse(localStorage.getItem('board-connect4'))

    if (firstTime && localArray) {
        for (const row of localArray) {
            boardArray.push(row)
        } return
    }

    //Cria a array onde haverá todas as informações
    for (let row = 0; row < rowsBoard; row++) {
        boardArray.push([])
        for (let columns = 0; columns < columnsBoard; columns++) {
            boardArray[row].push(0)
        }
    }
}

function clearArray() {
    //Limpa a array
    while (boardArray.length > 0) {
        boardArray.pop()
    }
}

setArray(true)
createCells(board, 'cell')
createCells(boardInv, 'cell-inv', true)

board.addEventListener('click', e => {
    if (e.target.classList.contains('cell') && !board.classList.contains('win')) handleCellClick(e)
})

function handleCellClick(e) {
    // Se a célula já foi revelada, não continua
    if (e.target.classList.contains('reveal')) return

    const column = parseInt(e.target.dataset.cellCol)

    // Verifica qual é a última célula disponível daquela coluna
    let row = boardArray.length - 1
    while (boardArray[row][column] === 'f' || boardArray[row][column] === 's') {
        row--
    }

    // Atualiza o valor dela para o 'f' ou 's' ('first' e 'second')
    boardArray[row][column] = actualTeam.charAt(0)

    const backCell = getCell([...document.querySelectorAll('.cell-inv')], column, row)
    const frontCell = getCell([...document.querySelectorAll('.cell')], column, row)

    backCell.classList.add(`${actualTeam}-team`)
    frontCell.classList.add('reveal')

    // Troca a vez
    actualTeam = actualTeam == 'first' ? 'second' : 'first'
    flipTurn()

    // Salva o estado atual do tabuleiro
    localStorage.setItem('board-connect4', JSON.stringify(boardArray))

    // Verifica se ganhou
    if (checkWin()) {
        board.classList.add('win')
        setTimeout(() => {
            startConfetti()
            setTimeout(() => {
                stopConfetti()
            }, 1000)
        }, 300);
    }
}

function getCell(cells, c, r) {
    return cells.find(cell => cell.dataset.cellCol == c && cell.dataset.cellRow == r)
}

function flipTurn() {
    if (
        turnCellF.classList.contains('turn-back') &&
        turnCellS.classList.contains(`turn-front`)
        ) {

        turnCellF.classList.remove(`turn-back`)
        turnCellS.classList.remove(`turn-front`)

    } else {
        turnCellF.classList.add(`turn-back`)
        turnCellS.classList.add(`turn-front`)
    }

}

resetButton.addEventListener('click', handleReset)
function handleReset(e) {
    // Reseta o tabuleiro e a array
    const cellsInv = [...document.querySelectorAll('.cell-inv')]

    downBelow(cellsInv, columnsBoard)

    function downBelow(column, i) {
        const newI = i - 1
        if (newI < 0) {
            setTimeout(() => {
                board.classList.remove('win')
                clearArray()
                setArray()
                createCells(board, 'cell')
                createCells(boardInv, 'cell-inv')
                
                // Salva o estado atual do tabuleiro
                localStorage.setItem('board-connect4', JSON.stringify(boardArray))
        
                actualTeam = 'first'
                turnCellF.classList.remove(`turn-back`)
                turnCellS.classList.remove(`turn-front`)
            }, 500);

            return
        }

        const filtered = column.filter((cell, index) => index % columnsBoard == newI)

        if (isColumnEmpty(filtered)) {
            downBelow(column, newI)
            return
        }

        filtered.forEach(cell => cell.classList.add('down-below'))
        
        setTimeout(() => {
            if (newI >= 0) downBelow(column, newI)
        }, 50)
    }
}

function isColumnEmpty(column){
    return column.map(cell => cell.classList.toString())
        .every(classy => classy === "cell-inv")
}

function checkWin(firstime = false) {
    // Retorna a coluna de uma array bidimensional
    const arrayColumn = (arr, n) => arr.map(x => x[n])

    const arrayFromBoard = new Array()
    const cells = [...document.querySelectorAll('.cell-inv')] 

    for (let r = 0; r < rowsBoard; r++) {
        arrayFromBoard.push([])
        for (let c = 0; c < columnsBoard; c++) {
            arrayFromBoard[r].push(cells[0])
            cells.shift()
        }
    }

    // Verifica se há quatro células iguais na linha
    for (let row of arrayFromBoard) {
        const rowConsec = hasConsecutive(row)
        if (rowConsec) { 
            if (!firstime) setBlink(rowConsec)
            return true
        }
    }

    // Verifica se há quatro células iguais na coluna
    for (let i = 0; i < columnsBoard - 1; i++) {
        const column = arrayColumn(arrayFromBoard, i)
        const columnConsec = hasConsecutive(column)
        if (columnConsec) { 
            if (!firstime) setBlink(columnConsec)
            return true
        }
    }

    for (let diagonal of diagonals(arrayFromBoard)) {
        const diagonalConsec = hasConsecutive(diagonal)
        if (diagonalConsec) { 
            if (!firstime) setBlink(diagonalConsec)
            return true
        }
    }

    return false
}

function boardToArray(arr) {
    return arr.map(cell => {
        if (cell.classList.contains('first-team')) return 'f'
        if (cell.classList.contains('second-team')) return 's'
        return 0
    })
} 

function setBlink(cellsObj) {
    setTimeout(() => {
        const cells = cellsObj.consecutives
        const team = cellsObj.char === 'f' ? 'first' : 'second'
        cells.forEach(cell => cell.classList.add(`blink-${team}`))
    }, 100);
}

function diagonals(matrix) {
    const result = []
    const numRows = matrix.length
    const numCols = matrix[0].length

    // Para cada coluna (diagonal descendente)
    for (let col = 0; col < numCols; col++) {
        const diagonal = [];

        // Adiciona a respectiva diagonal, da esquerda para direita
        for (let row = 0; row < numRows && col + row < numCols; row++) {
            diagonal.push(matrix[row][col + row]);
        }

        if (diagonal.length > 0) {
            result.push(diagonal);
        }
    }

    // Para cada linha (diagonal descendente)
    for (let row = 1; row < numRows; row++) {
        const diagonal = [];

        // Adiciona a respectiva diagonal, da segunda linha para baixo
        for (let col = 0; col < numCols && row + col < numRows; col++) {
            diagonal.push(matrix[row + col][col]);
        }

        if (diagonal.length > 0) {
            result.push(diagonal);
        }
    }

    // Para cada linha (diagonal ascendente)
    for (let row = 1; row < numRows; row++) {
        const diagonal = [];

        // Adiciona a respectiva diagonal, da segunda linha para baixo
        for (let col = 0; col < numCols && row - col >= 0; col++) {
            diagonal.push(matrix[row - col][col]);
        }

        if (diagonal.length > 0) {
            result.push(diagonal);
        }
    }

    // Para cada coluna (diagonal ascendente)
    for (let col = 1; col < numCols - 1; col++) {
        const diagonal = [];

        // Adiciona a respectiva diagonal, da esquerda para direita
        for (let row = 0; row + col < numCols && (numRows - 1) - row >= 0; row++) {
            diagonal.push(matrix[(numRows - 1) - row][col + row]);
        }

        if (diagonal.length > 0) {
            result.push(diagonal);
        }
    }

    return result;
}

function hasConsecutive(arr, n = 4) {
    if (arr.length < n) {
        // Se a array tem menos de n elementos, não pode haver n elementos consecutivos iguais
        return false 
    }

    for (let i = 0; i <= arr.length - n; i++) {
        let arrTrans = boardToArray(arr)
        if (arrTrans[i] === 0) continue

        let hasConsecutive = true
        let char = arrTrans[i]
        let consecutives = new Array()
        consecutives.push(arr[i])

        // Verifica se o próximo elemento é igual ao anterior
        for (let j = i + 1; j < i + n; j++) {
            if (arrTrans[j] !== arrTrans[i]) {
                hasConsecutive = false
                consecutives = []
                break
            }
            consecutives.push(arr[j])
        }

        if (hasConsecutive) {
            return {consecutives, char}
        }
    }

    return false
}