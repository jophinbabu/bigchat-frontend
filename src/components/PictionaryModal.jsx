import { useState, useRef, useEffect } from "react";
import { X, Trophy, Palette, Eraser, Send, Timer, RotateCcw, Check, PenTool } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import ReactConfetti from 'react-confetti';

const WORDS = ["Apple", "Tree", "Car", "House", "Sun", "Smile", "Ball", "Flower", "Book", "Computer", "Cat", "Dog", "Pizza", "Robot", "Star"];

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

    // --- Canvas Logic ---
    const getCoordinates = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        // Calculate scale factor (Internal Resolution / Display Size)
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
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
        ctx.lineJoin = "round";
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
        }
        setGuessInput("");
    };

    return (
        <div className="fixed inset-0 bg-base-300/80 z-50 flex items-center justify-center p-4 backdrop-blur-md">
            {winner && <ReactConfetti recycle={false} numberOfPieces={500} />}

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-base-100 w-full max-w-5xl h-[92vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-base-content/10 relative"
            >
                {/* 1. Header Bar */}
                <div className="px-6 py-4 bg-base-100 flex items-center justify-between z-10 border-b border-base-200">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 bg-secondary/10 px-4 py-2 rounded-2xl">
                            <Palette className="size-5 text-secondary" />
                            <span className="font-extrabold text-secondary tracking-wide text-sm md:text-base">PICTIONARY</span>
                        </div>
                        <div className="h-8 w-px bg-base-content/10 mx-2 hidden md:block"></div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-base-content/40 uppercase tracking-widest">Opponent</span>
                            <span className="font-bold text-sm">{selectedUser?.fullName}</span>
                        </div>
                    </div>

                    {/* Timer & Status */}
                    {gameState === 'playing' && (
                        <div className="absolute left-1/2 -translate-x-1/2 top-4 flex flex-col items-center">
                            <div className={`flex items-center gap-2 px-5 py-2 rounded-full font-mono font-black text-lg shadow-inner ${timeLeft < 10 ? 'bg-error text-error-content animate-pulse' : 'bg-base-200 text-base-content'}`}>
                                <Timer className="size-5" />
                                {timeLeft}
                            </div>
                        </div>
                    )}

                    <button onClick={closePictionary} className="btn btn-circle btn-ghost btn-sm hover:bg-base-200">
                        <X className="size-6" />
                    </button>
                </div>

                {/* 2. Main Game Area */}
                <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">

                    {/* DRAWING CANVAS */}
                    <div className="flex-1 bg-base-200/50 p-4 md:p-6 relative flex flex-col justify-center items-center">

                        {/* Game Overlays */}
                        <AnimatePresence>
                            {/* Word Selection Overlay */}
                            {gameState === 'selecting' && isDrawer && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-base-100/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-8 text-center"
                                >
                                    <h3 className="text-3xl md:text-4xl font-black mb-2">It's Your Turn to Draw! 🎨</h3>
                                    <p className="text-lg opacity-60 mb-8 max-w-md">Pick a word from the list below. The timer starts as soon as you choose.</p>

                                    <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
                                        {WORDS.map((w, i) => (
                                            <motion.button
                                                key={w}
                                                whileHover={{ scale: 1.05, y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
                                                onClick={() => startGame(w)}
                                                className="btn btn-lg btn-primary shadow-lg border-b-4 border-primary-focus active:border-b-0 active:translate-y-1"
                                            >
                                                {w}
                                            </motion.button>
                                        ))}
                                    </div>
                                    <button onClick={() => setPictionaryRole('guesser')} className="btn btn-ghost mt-8 opacity-50">Switch Roles (Testing)</button>
                                </motion.div>
                            )}

                            {/* Waiting Overlay */}
                            {gameState === 'selecting' && !isDrawer && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-base-100/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center"
                                >
                                    <div className="loading loading-bars loading-lg text-secondary mb-4"></div>
                                    <h3 className="text-2xl font-bold animate-pulse">Waiting for artist to pick a word...</h3>
                                    <p className="opacity-50">Get your guessing fingers ready!</p>
                                </motion.div>
                            )}

                            {/* Game Over Overlay */}
                            {gameState === 'finished' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                    className="absolute inset-0 bg-base-100/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-6 p-8 text-center"
                                >
                                    {winner === 'timeout' ? (
                                        <div className="size-24 bg-base-200 rounded-full flex items-center justify-center mb-2">
                                            <Timer className="size-12 opacity-50" />
                                        </div>
                                    ) : (
                                        <motion.div
                                            initial={{ rotate: -10, scale: 0 }} animate={{ rotate: 0, scale: 1 }}
                                            className="size-24 bg-yellow-100 rounded-full flex items-center justify-center mb-2 ring-4 ring-yellow-400"
                                        >
                                            <Trophy className="size-12 text-yellow-500" />
                                        </motion.div>
                                    )}

                                    <div>
                                        <h3 className="text-4xl md:text-5xl font-black mb-2">
                                            {winner === 'timeout' ? "Time's Up!" :
                                                winner === 'You' || winner === "Partner" ? `${winner} Won!` : "Game Over"}
                                        </h3>
                                        <div className="text-2xl bg-base-200 px-6 py-3 rounded-xl inline-block mt-4 border border-base-300">
                                            Word: <span className="font-bold text-primary">{word}</span>
                                        </div>
                                    </div>

                                    {isDrawer && (
                                        <button onClick={() => setGameState('selecting')} className="btn btn-lg btn-outline gap-3 mt-4">
                                            <RotateCcw className="size-5" /> Play Again
                                        </button>
                                    )}
                                    {!isDrawer && <p className="animate-pulse opacity-60">Waiting for host to restart...</p>}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Top Hint Bar */}
                        <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl shadow-sm border border-base-200 mb-6 flex items-center gap-3">
                            {isDrawer ? (
                                <>
                                    <h3 className="uppercase text-xs font-bold tracking-widest opacity-50">Drawing</h3>
                                    <span className="text-2xl font-black text-primary tracking-wide">{word}</span>
                                </>
                            ) : (
                                <>
                                    <h3 className="uppercase text-xs font-bold tracking-widest opacity-50">Guessing</h3>
                                    <div className="flex gap-2">
                                        {word.split('').map((_, i) => (
                                            <div key={i} className="w-8 h-10 bg-base-200 rounded-md border-b-4 border-base-300"></div>
                                        ))}
                                    </div>
                                    <span className="text-sm font-bold opacity-40 ml-2">({word.length} letters)</span>
                                </>
                            )}
                        </div>

                        {/* Canvas Container */}
                        <div className="relative w-full max-w-4xl aspect-[4/3] bg-white rounded-2xl shadow-xl overflow-hidden touch-none border-4 border-base-content/5 ring-1 ring-base-content/5">
                            <canvas
                                ref={canvasRef}
                                width={800}
                                height={600}
                                className="w-full h-full object-contain"
                                style={{ cursor: isDrawer ? `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'  width='24' height='24' viewport='0 0 100 100' style='fill:black;font-size:30px;'><text y='50%'>✏️</text></svg>") 0 24, auto` : "default" }}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                            />
                        </div>

                        {/* Floating Tools Dock (Drawer Only) */}
                        <AnimatePresence>
                            {isDrawer && (
                                <motion.div
                                    initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                    className="absolute bottom-6 bg-base-100/90 backdrop-blur-xl p-2 pr-6 pl-6 rounded-full shadow-2xl border border-base-content/10 flex items-center gap-6"
                                >
                                    <div className="flex bg-base-200 p-1 rounded-full">
                                        <button
                                            className={`p-3 rounded-full transition ${tool === 'pen' ? 'bg-primary text-primary-content shadow-md' : 'hover:bg-base-300 text-base-content/50'}`}
                                            onClick={() => setTool('pen')}
                                            title="Pen"
                                        >
                                            <PenTool className="size-5" />
                                        </button>
                                        <button
                                            className={`p-3 rounded-full transition ${tool === 'eraser' ? 'bg-error text-error-content shadow-md' : 'hover:bg-base-300 text-base-content/50'}`}
                                            onClick={() => setTool('eraser')}
                                            title="Eraser"
                                        >
                                            <Eraser className="size-5" />
                                        </button>
                                    </div>

                                    <div className="h-8 w-px bg-base-content/10"></div>

                                    {/* Colors */}
                                    <div className="flex items-center gap-2">
                                        {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'].map(c => (
                                            <button
                                                key={c}
                                                className={`size-6 rounded-full border-2 transition hover:scale-110 ${color === c ? 'border-primary scale-110' : 'border-transparent opacity-80'}`}
                                                style={{ backgroundColor: c }}
                                                onClick={() => setColor(c)}
                                            />
                                        ))}
                                        {/* Custom Picker */}
                                        <div className="relative size-8 rounded-full overflow-hidden border-2 border-base-content/20 hover:scale-105 transition active:scale-95">
                                            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                            <div className="w-full h-full" style={{ backgroundColor: color }}></div>
                                        </div>
                                    </div>

                                    <div className="h-8 w-px bg-base-content/10"></div>

                                    {/* Brush Size */}
                                    <div className="flex items-center gap-2 w-24">
                                        <div className="size-1 rounded-full bg-base-content/50"></div>
                                        <input
                                            type="range"
                                            min="2" max="30"
                                            value={brushSize}
                                            onChange={(e) => setBrushSize(e.target.value)}
                                            className="range range-xs range-secondary flex-1"
                                        />
                                        <div className="size-3 rounded-full bg-base-content/50"></div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* 3. SIDEBAR (Chat) */}
                    <div className="w-full md:w-80 bg-base-100 border-l border-base-200 flex flex-col z-20 shadow-xl">
                        <div className="p-4 bg-base-200/50 border-b border-base-200 font-bold uppercase text-xs tracking-widest text-base-content/50 flex justify-between items-center">
                            <span>Game Chat</span>
                            <span className="badge badge-sm badge-neutral">{guesses.length}</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-base-100/50">
                            {guesses.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-base-content/30 italic text-sm">
                                    <Send className="size-8 mb-2 opacity-20" />
                                    No guesses yet...
                                </div>
                            )}
                            {guesses.map((g, i) => (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                    key={i}
                                    className={`p-3 rounded-2xl text-sm border shadow-sm ${g.isCorrect ? 'bg-success text-success-content border-success font-bold text-center' : 'bg-base-100 border-base-200'}`}
                                >
                                    {!g.isCorrect && <div className="text-xs font-bold opacity-50 mb-1">{g.senderName || "Unknown"}</div>}
                                    <div className="break-words leading-relaxed">
                                        {g.isCorrect && <Check className="inline-block size-4 mr-1" />}
                                        {g.text}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <form onSubmit={submitGuess} className="p-4 bg-base-100 border-t border-base-200">
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder={!isDrawer ? "Type your guess here..." : "Chat disabled for artist"}
                                    value={guessInput}
                                    onChange={(e) => setGuessInput(e.target.value)}
                                    disabled={isDrawer || gameState !== 'playing'}
                                    className="input input-filled w-full pr-12 bg-base-200 focus:bg-base-100 focus:ring-2 focus:ring-primary transition-all rounded-xl"
                                />
                                <button
                                    type="submit"
                                    disabled={isDrawer || !guessInput.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary text-primary-content hover:bg-primary-focus transition-colors disabled:opacity-0 disabled:scale-50"
                                >
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
