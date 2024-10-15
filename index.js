const board = document.getElementById('shogi-board');
const turnIndicator = document.getElementById('turn-indicator');
const whiteCaptured = document.getElementById('white-captured');
const blackCaptured = document.getElementById('black-captured');
let selectedPiece = null;
let currentTurn = 'black';
let gameBoard = [
    ['L', 'N', 'S', 'G', 'K', 'G', 'S', 'N', 'L'],
    [' ', 'R', ' ', ' ', ' ', ' ', ' ', 'B', ' '],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    [' ', 'b', ' ', ' ', ' ', ' ', ' ', 'r', ' '],
    ['l', 'n', 's', 'g', 'k', 'g', 's', 'n', 'l']
];

const pieceSymbols = {
    'L': '香', 'N': '桂', 'S': '銀', 'G': '金', 'K': '玉', 'R': '飛', 'B': '角', 'P': '歩',
    'l': '香', 'n': '桂', 's': '銀', 'g': '金', 'k': '玉', 'r': '飛', 'b': '角', 'p': '歩',
    '+L': '杏', '+N': '圭', '+S': '全', '+R': '龍', '+B': '馬', '+P': 'と',
    '+l': '杏', '+n': '圭', '+s': '全', '+r': '龍', '+b': '馬', '+p': 'と'
};

function createBoard() {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.addEventListener('click', handleCellClick);
            board.appendChild(cell);
        }
    }
    updateBoard();
    updateTurnIndicator();
}

function updateBoard() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        const row = cell.dataset.row;
        const col = cell.dataset.col;
        const piece = gameBoard[row][col];
        cell.textContent = pieceSymbols[piece] || '';
        cell.classList.remove('piece-black', 'piece-white', 'promotion-marker', 'possible-move');
        if (piece !== ' ') {
            cell.classList.add(piece.toLowerCase() === piece ? 'piece-black' : 'piece-white');
            if (piece.startsWith('+')) {
                cell.classList.add('promotion-marker');
            }
        }
    });
}

function handleCellClick(event) {
    const cell = event.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    if (selectedPiece && selectedPiece.classList.contains('captured-piece')) {
        if (canDropPiece(selectedPiece.textContent, row, col)) {
            dropPiece(selectedPiece, row, col);
            selectedPiece.classList.remove('selected');
            selectedPiece = null;
            switchTurn();
        }
    } else if (selectedPiece) {
        if (isValidMove(selectedPiece, row, col)) {
            const fromRow = parseInt(selectedPiece.dataset.row);
            const fromCol = parseInt(selectedPiece.dataset.col);
            const movingPiece = gameBoard[fromRow][fromCol];
            const targetPiece = gameBoard[row][col];

            // 自分の駒を取ることができないようにチェック
            if (targetPiece !== ' ' && isPieceOwnedByCurrentPlayer(row, col)) {
                alert('自分の駒は取れません。');
                return;
            }

            movePiece(selectedPiece, row, col);
            selectedPiece.classList.remove('selected');
            selectedPiece = null;
            switchTurn();
        }
    } else if (gameBoard[row][col] !== ' ' && isPieceOwnedByCurrentPlayer(row, col)) {
        cell.classList.add('selected');
        selectedPiece = cell;
        showPossibleMoves(row, col);
    }
}

function showPossibleMoves(row, col) {
    clearPossibleMoves();
    const piece = gameBoard[row][col];
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (isValidMove({ dataset: { row, col } }, i, j)) {
                const cell = document.querySelector(`.cell[data-row="${i}"][data-col="${j}"]`);
                cell.classList.add('possible-move');
            }
        }
    }
}

function clearPossibleMoves() {
    document.querySelectorAll('.possible-move').forEach(cell => cell.classList.remove('possible-move'));
}

function isValidMove(from, toRow, toCol) {
    const fromRow = parseInt(from.dataset.row);
    const fromCol = parseInt(from.dataset.col);
    const piece = gameBoard[fromRow][fromCol];
    const isPromotionZone = (currentTurn === 'black' && toRow <= 2) || (currentTurn === 'white' && toRow >= 6);

    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;

    switch (piece.toLowerCase()) {
        case 'p':
            return colDiff === 0 && ((currentTurn === 'black' && rowDiff === -1) || (currentTurn === 'white' && rowDiff === 1));
        case 'l':
            return colDiff === 0 && ((currentTurn === 'black' && rowDiff < 0) || (currentTurn === 'white' && rowDiff > 0));
        case 'n':
            return (Math.abs(colDiff) === 1 && ((currentTurn === 'black' && rowDiff === -2) || (currentTurn === 'white' && rowDiff === 2)));
        case 's':
            return (Math.abs(rowDiff) === 1 && Math.abs(colDiff) <= 1) || (rowDiff === -1 && colDiff === 0);
        case 'g':
        case '+p':
        case '+l':
        case '+n':
        case '+s':
            return (Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1) && !(Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 1 && ((currentTurn === 'black' && rowDiff > 0) || (currentTurn === 'white' && rowDiff < 0)));
        case 'k':
            return Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1;
        case 'r':
            return (rowDiff === 0 || colDiff === 0) && !isPieceInPath(fromRow, fromCol, toRow, toCol);
        case '+r':
            return ((rowDiff === 0 || colDiff === 0) && !isPieceInPath(fromRow, fromCol, toRow, toCol)) || (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 1);
        case 'b':
            return Math.abs(rowDiff) === Math.abs(colDiff) && !isPieceInPath(fromRow, fromCol, toRow, toCol);
        case '+b':
            return (Math.abs(rowDiff) === Math.abs(colDiff) && !isPieceInPath(fromRow, fromCol, toRow, toCol)) || (Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1);
        default:
            return false;
    }
}

function isPieceInPath(fromRow, fromCol, toRow, toCol) {
    const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
    const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;
    let row = fromRow + rowStep;
    let col = fromCol + colStep;

    while (row !== toRow || col !== toCol) {
        if (gameBoard[row][col] !== ' ') {
            return true;
        }
        row += rowStep;
        col += colStep;
    }

    return false;
}

function movePiece(from, toRow, toCol) {
    const fromRow = parseInt(from.dataset.row);
    const fromCol = parseInt(from.dataset.col);
    const piece = gameBoard[fromRow][fromCol];
    const capturedPiece = gameBoard[toRow][toCol];

    if (capturedPiece !== ' ') {
        const capturedPieceSymbol = pieceSymbols[capturedPiece];
        const capturedPieceElement = document.createElement('div');
        capturedPieceElement.textContent = capturedPieceSymbol;
        capturedPieceElement.classList.add('captured-piece');
        capturedPieceElement.classList.add(currentTurn === 'black' ? 'piece-black' : 'piece-white');
        capturedPieceElement.addEventListener('click', handleCapturedPieceClick);
        (currentTurn === 'black' ? blackCaptured : whiteCaptured).appendChild(capturedPieceElement);
    }

    gameBoard[toRow][toCol] = piece;
    gameBoard[fromRow][fromCol] = ' ';

    const isPromotionZone = (currentTurn === 'black' && toRow <= 2) || (currentTurn === 'white' && toRow >= 6);
    if (isPromotionZone && !piece.startsWith('+') && piece.toLowerCase() !== 'k' && piece.toLowerCase() !== 'g') {
        if (confirm('駒を成りますか？')) {
            gameBoard[toRow][toCol] = '+' + piece;
        }
    }

    updateBoard();
    clearPossibleMoves();

    // 王手と詰みのチェック
    const oppositeColor = currentTurn === 'black' ? 'white' : 'black';
    if (isKingInCheck(oppositeColor)) {
        if (isCheckmate(oppositeColor)) {
            alert(`${currentTurn === 'black' ? '先手' : '後手'}の勝利です！`);
        } else {
            alert('王手！');
        }
    }
}

function handleCapturedPieceClick(event) {
    if (event.target.classList.contains(currentTurn === 'black' ? 'piece-black' : 'piece-white')) {
        if (selectedPiece) {
            selectedPiece.classList.remove('selected');
        }
        selectedPiece = event.target;
        selectedPiece.classList.add('selected');
        showPossibleDrops(event.target.textContent);
    }
}

function showPossibleDrops(piece) {
    clearPossibleMoves();
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (canDropPiece(piece, i, j)) {
                const cell = document.querySelector(`.cell[data-row="${i}"][data-col="${j}"]`);
                cell.classList.add('possible-move');
            }
        }
    }
}

function canDropPiece(piece, row, col) {
    if (gameBoard[row][col] !== ' ') {
        return false;
    }

    const normalizedPiece = piece.toLowerCase();

    // 二歩のチェック
    if (normalizedPiece === 'p') {
        for (let i = 0; i < 9; i++) {
            if (gameBoard[i][col].toLowerCase() === 'p' && 
                ((currentTurn === 'black' && gameBoard[i][col] === 'p') || 
                 (currentTurn === 'white' && gameBoard[i][col] === 'P'))) {
                return false;
            }
        }
    }

    // 行き所のない駒のチェック
    if ((normalizedPiece === 'p' || normalizedPiece === 'l') && 
        ((currentTurn === 'black' && row === 0) || (currentTurn === 'white' && row === 8))) {
        return false;
    }
    if (normalizedPiece === 'n' && 
        ((currentTurn === 'black' && row <= 1) || (currentTurn === 'white' && row >= 7))) {
        return false;
    }

    return true;
}

function dropPiece(capturedPiece, row, col) {
    const piece = capturedPiece.textContent;
    const boardPiece = currentTurn === 'black' ? piece.toLowerCase() : piece.toUpperCase();
    gameBoard[row][col] = boardPiece;
    updateBoard();
    clearPossibleMoves();

    // 王手と詰みのチェック
    const oppositeColor = currentTurn === 'black' ? 'white' : 'black';
    if (isKingInCheck(oppositeColor)) {
        if (isCheckmate(oppositeColor)) {
            alert(`${currentTurn === 'black' ? '先手' : '後手'}の勝利です！`);
        } else {
            alert('王手！');
        }
    }
}

function switchTurn() {
    currentTurn = currentTurn === 'black' ? 'white' : 'black';
    updateTurnIndicator();
}

function updateTurnIndicator() {
    turnIndicator.textContent = `現在の手番: ${currentTurn === 'black' ? '先手' : '後手'}`;
}

function isPieceOwnedByCurrentPlayer(row, col) {
    const piece = gameBoard[row][col];
    return (currentTurn === 'black' && piece.toLowerCase() === piece) ||
           (currentTurn === 'white' && piece.toUpperCase() === piece);
}

function isKingInCheck(kingColor) {
    const kingSymbol = kingColor === 'black' ? 'k' : 'K';
    let kingRow, kingCol;

    // 玉の位置を見つける
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (gameBoard[i][j] === kingSymbol) {
                kingRow = i;
                kingCol = j;
                break;
            }
        }
        if (kingRow !== undefined) break;
    }

    // 相手の駒からの攻撃をチェック
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            const piece = gameBoard[i][j];
            if (piece !== ' ' && (kingColor === 'black' ? piece === piece.toUpperCase() : piece === piece.toLowerCase())) {
                if (isValidMove({ dataset: { row: i, col: j } }, kingRow, kingCol)) {
                    return true;
                }
            }
        }
    }

    return false;
}

function isCheckmate(kingColor) {
    const oppositeColor = kingColor === 'black' ? 'white' : 'black';
    
    // 王の全ての動きをチェック
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (gameBoard[i][j] === (kingColor === 'black' ? 'k' : 'K')) {
                for (let di = -1; di <= 1; di++) {
                    for (let dj = -1; dj <= 1; dj++) {
                        if (di === 0 && dj === 0) continue;
                        const newRow = i + di;
                        const newCol = j + dj;
                        if (newRow >= 0 && newRow < 9 && newCol >= 0 && newCol < 9) {
                            if (isValidMove({ dataset: { row: i, col: j } }, newRow, newCol)) {
                                const originalPiece = gameBoard[newRow][newCol];
                                gameBoard[newRow][newCol] = gameBoard[i][j];
                                gameBoard[i][j] = ' ';
                                const stillInCheck = isKingInCheck(kingColor);
                                gameBoard[i][j] = gameBoard[newRow][newCol];
                                gameBoard[newRow][newCol] = originalPiece;
                                if (!stillInCheck) return false;
                            }
                        }
                    }
                }
            }
        }
    }

    // 他の駒の動きをチェック
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            const piece = gameBoard[i][j];
            if (piece !== ' ' && (kingColor === 'black' ? piece === piece.toLowerCase() : piece === piece.toUpperCase())) {
                for (let newRow = 0; newRow < 9; newRow++) {
                    for (let newCol = 0; newCol < 9; newCol++) {
                        if (isValidMove({ dataset: { row: i, col: j } }, newRow, newCol)) {
                            const originalPiece = gameBoard[newRow][newCol];
                            gameBoard[newRow][newCol] = gameBoard[i][j];
                            gameBoard[i][j] = ' ';
                            const kingStillInCheck = isKingInCheck(kingColor);
                            gameBoard[i][j] = gameBoard[newRow][newCol];
                            gameBoard[newRow][newCol] = originalPiece;
                            if (!kingStillInCheck) return false;
                        }
                    }
                }
            }
        }
    }

    // 持ち駒を使って王手を防げるかチェック
    const capturedPieces = kingColor === 'black' ? blackCaptured : whiteCaptured;
    for (let piece of capturedPieces.children) {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (canDropPiece(piece.textContent, i, j)) {
                    const droppedPiece = kingColor === 'black' ? piece.textContent.toLowerCase() : piece.textContent.toUpperCase();
                    gameBoard[i][j] = droppedPiece;
                    const kingStillInCheck = isKingInCheck(kingColor);
                    gameBoard[i][j] = ' ';
                    if (!kingStillInCheck) return false;
                }
            }
        }
    }

    return true;
}

createBoard();

// 持ち駒のクリックイベントを追加
whiteCaptured.addEventListener('click', handleCapturedPieceClick);
blackCaptured.addEventListener('click', handleCapturedPieceClick);