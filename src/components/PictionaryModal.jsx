import { useState, useRef, useEffect } from "react";
import { X, Trophy, Palette, Eraser, Send, Timer, RotateCcw } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const WORDS = ["Apple", "Tree", "Car", "House", "Sun", "Smile", "Ball", "Flower", "Book", "Computer", "Cat", "Dog"];

const PictionaryModal = () => {
    const { closePictionary, selectedUser, pictionaryRole, setPictionaryRole } = useChatStore();
    const { socket, authUser } = useAuthStore();

    // Game State
    const [gameState, setGameState] = useState('selecting'); // selecting, playing, finished
    const [word, setWord] = useState('');
    const [timeLeft, setTimeLeft] = useState(60);
    const [guesses, setGuesses] = useState([]); // { text, sender, isCorrect }
    const [guessInput, setGuessInput] = useState("");
    const [winner, setWinner] = useState(null);

    // Canvas State
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState("#000000");
    const [brushSize, setBrushSize] = useState(5);
    const [tool, setTool] = useState("pen"); // pen, eraser

    // Role helpers
    const isDrawer = pictionaryRole === 'drawer';

    // --- Socket Initial Setup ---
    useEffect(() => {
        if (!socket) return;

        const onStart = (data) => {
            setWord(data.word);
            setGameState('playing');
            setTimeLeft(60);
            setGuesses([]);
            setWinner(null);
            clearCanvas();
        };

        const onDraw = (data) => {
            if (!isDrawer) drawLine(data, false);
        };

        const onGuess = (data) => {
            setGuesses(prev => [...prev, data]);
            if (data.isCorrect) {
                setWinner(data.senderId === authUser._id ? "You" : "Partner");
                setGameState('finished');
                toast.success(`${data.senderName} guessed the word!`);
            }
        };

        const onGameOver = (data) => {
            setGameState('finished');
            setWinner(data.winner); // 'timeout' or name
        };

        socket.on("pictionary-start", onStart);
        socket.on("pictionary-draw", onDraw);
        socket.on("pictionary-guess", onGuess);
        socket.on("pictionary-game-over", onGameOver);

        return () => {
            socket.off("pictionary-start", onStart);
            socket.off("pictionary-draw", onDraw);
            socket.off("pictionary-guess", onGuess);
            socket.off("pictionary-game-over", onGameOver);
        };
    }, [socket, isDrawer, authUser]);

    // --- Timer Logic ---
    useEffect(() => {
        let timer;
        if (gameState === 'playing' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        if (isDrawer) socket.emit("pictionary-game-over", { to: selectedUser._id, winner: "timeout" });
                        setGameState('finished');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [gameState, timeLeft, isDrawer, socket, selectedUser]);

    // --- Canvas Logic (Simplified) ---
    const getCoordinates = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const drawLine = ({ x, y, lastX, lastY, color, width }, emit = true) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx) return;

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = "round";
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();

        if (emit && isDrawer && socket && selectedUser) {
            socket.emit("pictionary-draw", {
                to: selectedUser._id,
                x, y, lastX, lastY, color, width
            });
        }
    };

    const startDrawing = (e) => {
        if (!isDrawer || gameState !== 'playing') return;
        const { x, y } = getCoordinates(e);
        setIsDrawing(true);
        canvasRef.current.lastX = x;
        canvasRef.current.lastY = y;
    };

    const draw = (e) => {
        if (!isDrawing || !isDrawer || gameState !== 'playing') return;
        e.preventDefault();
        const { x, y } = getCoordinates(e);
        const lastX = canvasRef.current.lastX;
        const lastY = canvasRef.current.lastY;

        drawLine({
            x, y, lastX, lastY,
            color: tool === 'eraser' ? '#ffffff' : color,
            width: brushSize
        });

        canvasRef.current.lastX = x;
        canvasRef.current.lastY = y;
    };

    const stopDrawing = () => setIsDrawing(false);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    // --- Game Logic ---
    const startGame = (selectedWord) => {
        setWord(selectedWord);
        setGameState('playing');
        setTimeLeft(60);
        setGuesses([]);
        setWinner(null);
        clearCanvas();

        socket.emit("pictionary-start", {
            to: selectedUser._id,
            word: selectedWord,
            drawerId: authUser._id
        });
    };

    const submitGuess = (e) => {
        e.preventDefault();
        if (!guessInput.trim()) return;

        const isCorrect = guessInput.toLowerCase().trim() === word.toLowerCase();
        const guessData = {
            text: guessInput,
            sender: "You",
            senderId: authUser._id,
            senderName: authUser.fullName,
            isCorrect
        };

        setGuesses(prev => [...prev, guessData]);
        socket.emit("pictionary-guess", { to: selectedUser._id, ...guessData });

        if (isCorrect) {
            setGameState('finished');
            setWinner("You");
            toast.success("Correct! You won! 🎉");
        }
        setGuessInput("");
    };

    return (
        <div className="fixed inset-0 bg-base-100/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-base-100 w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-base-content/10"
            >
                {/* Header */}
                <div className="p-4 border-b border-base-content/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-secondary/10 rounded-xl">
                            <Palette className="size-6 text-secondary" />
                        </div>
                        <div>
                            <h2 className="font-black text-xl tracking-tight">Pictionary</h2>
                            <p className="text-xs font-medium opacity-60">
                                {isDrawer ? "You are Drawing" : "You are Guessing"} vs {selectedUser?.fullName}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {gameState === 'playing' && (
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold ${timeLeft < 10 ? 'bg-error/10 text-error' : 'bg-base-200'}`}>
                                <Timer className="size-4" />
                                {timeLeft}s
                            </div>
                        )}
                        <button onClick={closePictionary} className="btn btn-circle btn-ghost">
                            <X className="size-6" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col md:flex-row min-h-0">

                    {/* DRAWING AREA */}
                    <div className="flex-1 bg-base-200/50 p-4 relative flex flex-col">
                        {/* Word Display / Overlay */}
                        {gameState === 'selecting' && isDrawer && (
                            <div className="absolute inset-0 bg-base-100/80 z-20 flex flex-col items-center justify-center gap-4">
                                <h3 className="text-2xl font-bold">Choose a word to draw</h3>
                                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                                    {WORDS.map(w => (
                                        <button key={w} onClick={() => startGame(w)} className="btn btn-primary">{w}</button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {gameState === 'selecting' && !isDrawer && (
                            <div className="absolute inset-0 bg-base-100/80 z-20 flex flex-col items-center justify-center">
                                <h3 className="text-xl font-bold animate-pulse">Waiting for drawer to pick a word...</h3>
                            </div>
                        )}
                        {gameState === 'finished' && (
                            <div className="absolute inset-0 bg-base-100/90 z-20 flex flex-col items-center justify-center gap-4">
                                <Trophy className="size-16 text-yellow-500 mb-2" />
                                <h3 className="text-3xl font-black">
                                    {winner === 'timeout' ? "Time's Up!" :
                                        winner === 'You' || winner === 'Partner' ? `${winner} Won!` : "Game Over"}
                                </h3>
                                <p className="text-xl">The word was: <span className="font-bold text-primary">{word}</span></p>
                                {isDrawer && (
                                    <button onClick={() => setGameState('selecting')} className="btn btn-outline gap-2 mt-4">
                                        <RotateCcw className="size-4" /> Play Again
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Top Bar (Word or Hints) */}
                        <div className="bg-base-100 p-2 text-center text-lg font-bold rounded-xl mb-4 shadow-sm border border-base-content/5">
                            {isDrawer ? (
                                <span>Draw: <span className="text-primary uppercase tracking-widest ml-2">{word}</span></span>
                            ) : (
                                <span>Word: <span className="ml-2 tracking-[0.5em]">{word.split('').map(c => '_').join(' ')}</span> ({word.length} letters)</span>
                            )}
                        </div>

                        {/* Canvas */}
                        <div className="flex-1 bg-white rounded-xl shadow-inner border border-base-300 relative overflow-hidden touch-none"
                            style={{ cursor: isDrawer ? "crosshair" : "default" }}>
                            <canvas
                                ref={canvasRef}
                                width={800}
                                height={600}
                                className="w-full h-full object-contain"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                            />
                        </div>

                        {/* Tools (Drawer Only) */}
                        {isDrawer && (
                            <div className="mt-4 bg-base-100 p-2 rounded-2xl shadow-lg border border-base-content/10 flex items-center justify-between">
                                <div className="flex gap-2">
                                    <button
                                        className={`p-3 rounded-xl transition ${tool === 'pen' ? 'bg-primary text-primary-content' : 'hover:bg-base-200'}`}
                                        onClick={() => setTool('pen')}
                                    >
                                        <Palette className="size-5" />
                                    </button>
                                    <button
                                        className={`p-3 rounded-xl transition ${tool === 'eraser' ? 'bg-secondary text-secondary-content' : 'hover:bg-base-200'}`}
                                        onClick={() => setTool('eraser')}
                                    >
                                        <Eraser className="size-5" />
                                    </button>
                                </div>

                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-10 h-10 rounded-full cursor-pointer border-none bg-transparent"
                                />

                                <input
                                    type="range"
                                    min="2" max="20"
                                    value={brushSize}
                                    onChange={(e) => setBrushSize(e.target.value)}
                                    className="range range-xs w-24 range-primary"
                                />
                            </div>
                        )}
                    </div>

                    {/* GUESS AREA (Sidebar) */}
                    <div className="w-full md:w-80 border-l border-base-content/10 bg-base-100 flex flex-col">
                        <div className="p-4 border-b border-base-content/5 font-bold uppercase text-xs tracking-widest text-base-content/50">
                            Game Chat
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {guesses.map((g, i) => (
                                <div key={i} className={`p-2 rounded-lg text-sm ${g.isCorrect ? 'bg-success/20 text-success-content font-bold text-center' : 'bg-base-200'}`}>
                                    <span className="font-bold opacity-60 mr-2">{g.senderName || "Unknown"}:</span>
                                    {g.text}
                                </div>
                            ))}
                        </div>

                        <form onSubmit={submitGuess} className="p-4 border-t border-base-content/10">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={isDrawer ? "Chat is disabled for drawer" : "Type your guess..."}
                                    value={guessInput}
                                    onChange={(e) => setGuessInput(e.target.value)}
                                    disabled={isDrawer || gameState !== 'playing'}
                                    className="input input-bordered w-full pr-10"
                                />
                                <button type="submit" disabled={isDrawer} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary text-primary-content hover:bg-primary/90 disabled:opacity-50">
                                    <Send className="size-4" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PictionaryModal;
