import { useState, useEffect } from "react";
import { X, Trophy, RotateCcw, Gamepad2 } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const GameModal = () => {
    const { closeGame, selectedUser, gameSymbol, setGameSymbol } = useChatStore();
    const { socket, authUser } = useAuthStore();

    const [board, setBoard] = useState(Array(9).fill(null));
    const [isMyTurn, setIsMyTurn] = useState(gameSymbol === 'X'); // X always goes first
    const [winner, setWinner] = useState(null); // 'X', 'O', or 'Draw'
    const [winningLine, setWinningLine] = useState([]);

    // Reset game state
    const resetGame = (emit = true) => {
        setBoard(Array(9).fill(null));
        setWinner(null);
        setWinningLine([]);
        setIsMyTurn(gameSymbol === 'X'); // Reset turn login: X starts

        if (emit && socket && selectedUser) {
            socket.emit("game-reset", { to: selectedUser._id });
            toast("Game Reset!");
        }
    };

    // Check for winner
    const checkWinner = (squares) => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];

        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return { winner: squares[a], line: lines[i] };
            }
        }
        return null;
    };

    const handleMove = (index) => {
        if (board[index] || winner || !isMyTurn) return;

        const newBoard = [...board];
        newBoard[index] = gameSymbol;
        setBoard(newBoard);
        setIsMyTurn(false); // Wait for opponent

        // Check if I won with this move
        const winResult = checkWinner(newBoard);
        if (winResult) {
            setWinner(winResult.winner);
            setWinningLine(winResult.line);
            toast.success("You Won! 🎉");
        } else if (!newBoard.includes(null)) {
            setWinner("Draw");
            toast("It's a Draw!");
        }

        // Emit move
        if (socket && selectedUser) {
            socket.emit("game-move", {
                to: selectedUser._id,
                index,
                symbol: gameSymbol
            });
        }
    };

    // Socket Listeners
    useEffect(() => {
        if (!socket) return;

        const onGameMove = (data) => {
            setBoard((prev) => {
                const newBoard = [...prev];
                newBoard[data.index] = data.symbol;

                // Audio feedback?
                // check winner logic
                const winResult = checkWinner(newBoard);
                if (winResult) {
                    setWinner(winResult.winner);
                    setWinningLine(winResult.line);
                    if (winResult.winner !== gameSymbol) toast.error("You Lost!");
                } else if (!newBoard.includes(null)) {
                    setWinner("Draw");
                    toast("It's a Draw!");
                } else {
                    setIsMyTurn(true); // My turn now!
                }

                return newBoard;
            });
        };

        const onGameReset = () => {
            setBoard(Array(9).fill(null));
            setWinner(null);
            setWinningLine([]);
            setIsMyTurn(gameSymbol === 'X');
            toast("Opponent reset the game");
        };

        socket.on("game-move", onGameMove);
        socket.on("game-reset", onGameReset);

        return () => {
            socket.off("game-move", onGameMove);
            socket.off("game-reset", onGameReset);
        };
    }, [socket, gameSymbol]);

    // Initial invite if I am X
    useEffect(() => {
        if (gameSymbol === 'X' && socket && selectedUser && authUser) {
            socket.emit("game-invite", { to: selectedUser._id, sender: authUser });
        }
    }, []);

    // Render Square
    const renderSquare = (i) => {
        const isWinningSquare = winningLine.includes(i);
        const val = board[i];

        return (
            <motion.button
                whileHover={!val && !winner && isMyTurn ? { scale: 1.05 } : {}}
                whileTap={!val && !winner && isMyTurn ? { scale: 0.95 } : {}}
                onClick={() => handleMove(i)}
                disabled={!!val || !!winner || !isMyTurn}
                className={`
                    w-20 h-20 sm:w-24 sm:h-24 bg-base-200 rounded-xl flex items-center justify-center text-4xl font-bold shadow-sm transition-all
                    ${val === 'X' ? 'text-primary' : 'text-secondary'}
                    ${isWinningSquare ? 'bg-success text-success-content ring-2 ring-success' : ''}
                    ${!val && !winner && isMyTurn ? 'hover:bg-base-300 cursor-pointer' : 'cursor-default'}
                `}
            >
                {val}
            </motion.button>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-base-100 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-base-300 relative"
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Gamepad2 className="size-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl">Tic-Tac-Toe</h3>
                            <p className="text-xs opacity-60">vs {selectedUser?.fullName}</p>
                        </div>
                    </div>
                    <button onClick={closeGame} className="btn btn-circle btn-ghost btn-sm">
                        <X className="size-5" />
                    </button>
                </div>

                {/* Status Bar */}
                <div className={`text-center mb-6 p-3 rounded-xl font-bold transition-all
                    ${winner ? 'bg-success/10 text-success' :
                        isMyTurn ? 'bg-primary/10 text-primary animate-pulse' : 'bg-base-200 opacity-60'}
                `}>
                    {winner === "Draw" ? "It's a Draw! 🤝" :
                        winner ? (winner === gameSymbol ? "You Won! 🏆" : "You Lost! 💀") :
                            isMyTurn ? "Your Turn! (" + gameSymbol + ")" :
                                "Waiting for opponent..."}
                </div>

                {/* Board */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6 mx-auto w-fit">
                    {Array(9).fill(null).map((_, i) => (
                        <div key={i}>{renderSquare(i)}</div>
                    ))}
                </div>

                {/* Footer Controls */}
                <div className="flex justify-center">
                    <button
                        onClick={() => resetGame(true)}
                        className="btn btn-secondary btn-outline gap-2"
                    >
                        <RotateCcw className="size-4" /> Reset Game
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default GameModal;
