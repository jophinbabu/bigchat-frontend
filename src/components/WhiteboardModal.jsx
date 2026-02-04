import { useRef, useState, useEffect } from 'react';
import { X, Trash2, Eraser, Pen } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';

const WhiteboardModal = () => {
    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(3);
    const [tool, setTool] = useState('pen'); // 'pen' or 'eraser'

    const { closeWhiteboard, selectedUser } = useChatStore();
    const { socket } = useAuthStore();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set canvas size to match parent container (or fixed size for now)
        canvas.width = 800; // Fixed size for easier sync
        canvas.height = 600;

        const ctx = canvas.getContext('2d');
        ctx.lineCap = 'round';
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctxRef.current = ctx;

        // Socket Listeners for incoming drawing
        if (socket) {
            socket.on("whiteboard-draw", (data) => {
                const { prevX, prevY, currentX, currentY, color, width } = data;
                if (!ctxRef.current) return;

                const originalColor = ctxRef.current.strokeStyle;
                const originalWidth = ctxRef.current.lineWidth;

                ctxRef.current.strokeStyle = color;
                ctxRef.current.lineWidth = width;

                ctxRef.current.beginPath();
                ctxRef.current.moveTo(prevX, prevY);
                ctxRef.current.lineTo(currentX, currentY);
                ctxRef.current.stroke();
                ctxRef.current.closePath();

                // Restore local settings
                ctxRef.current.strokeStyle = originalColor;
                ctxRef.current.lineWidth = originalWidth;
            });

            socket.on("whiteboard-clear", () => {
                const canvas = canvasRef.current;
                if (canvas && ctxRef.current) {
                    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
                }
            });
        }

        return () => {
            if (socket) {
                socket.off("whiteboard-draw");
                socket.off("whiteboard-clear");
            }
        };
    }, [socket]); // Initial setup

    // Update context when color/width changes
    useEffect(() => {
        if (ctxRef.current) {
            ctxRef.current.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
            ctxRef.current.lineWidth = lineWidth;
        }
    }, [color, lineWidth, tool]);

    // Emit open event on mount
    useEffect(() => {
        if (socket && selectedUser) {
            socket.emit("whiteboard-open", { to: selectedUser._id });
        }
    }, []);

    const getCoords = (nativeEvent) => {
        if (nativeEvent.touches && nativeEvent.touches.length > 0) {
            const rect = canvasRef.current.getBoundingClientRect();
            return {
                offsetX: nativeEvent.touches[0].clientX - rect.left,
                offsetY: nativeEvent.touches[0].clientY - rect.top
            };
        }
        return {
            offsetX: nativeEvent.offsetX,
            offsetY: nativeEvent.offsetY
        };
    };

    // Re-implementing drawing with specific coordinate tracking for reliable emission
    const lastPos = useRef({ x: 0, y: 0 });

    const startDrawingReliable = (e) => {
        // Prevent scrolling on touch devices
        if (e.type === 'touchstart') {
            e.preventDefault();
        }

        const { offsetX, offsetY } = getCoords(e.nativeEvent);
        lastPos.current = { x: offsetX, y: offsetY };
        setIsDrawing(true);
    };

    const drawReliable = (e) => {
        if (!isDrawing) return;

        // Prevent scrolling on touch devices during drawing
        if (e.type === 'touchmove') {
            e.preventDefault();
        }

        const { offsetX, offsetY } = getCoords(e.nativeEvent);
        const ctx = ctxRef.current;

        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();

        // Emit
        if (socket && selectedUser) {
            socket.emit("whiteboard-draw", {
                to: selectedUser._id, // Send to the other user
                prevX: lastPos.current.x,
                prevY: lastPos.current.y,
                currentX: offsetX,
                currentY: offsetY,
                color: tool === 'eraser' ? '#ffffff' : color,
                width: lineWidth
            });
        }

        lastPos.current = { x: offsetX, y: offsetY };
    };

    const finishDrawing = () => {
        if (ctxRef.current) ctxRef.current.closePath();
        setIsDrawing(false);
    };
    const clearCanvas = () => {
        const canvas = canvasRef.current;
        ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);

        if (socket && selectedUser) {
            socket.emit("whiteboard-clear", { to: selectedUser._id });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-4 shadow-xl flex flex-col gap-4 relative w-full max-w-4xl">

                {/* Header / Tools */}
                <div className="flex justify-between items-center bg-gray-100 p-2 rounded-lg">
                    <div className="flex items-center gap-4">
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                disabled={tool === 'eraser'}
                                className="w-8 h-8 cursor-pointer rounded overflow-hidden p-0 border-none"
                            />
                            <div className="flex flex-col justify-center w-24">
                                <span className="text-xs text-black">Size: {lineWidth}</span>
                                <input
                                    type="range"
                                    min="1"
                                    max="20"
                                    value={lineWidth}
                                    onChange={(e) => setLineWidth(parseInt(e.target.value))}
                                    className="range range-xs range-primary"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 border-l pl-4 border-gray-300">
                            <button
                                onClick={() => setTool('pen')}
                                className={`btn btn-sm btn-circle ${tool === 'pen' ? 'btn-primary' : 'btn-ghost'}`}
                            >
                                <Pen size={18} />
                            </button>
                            <button
                                onClick={() => setTool('eraser')}
                                className={`btn btn-sm btn-circle ${tool === 'eraser' ? 'btn-primary' : 'btn-ghost'}`}
                            >
                                <Eraser size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={clearCanvas}
                            className="btn btn-sm btn-error text-white"
                        >
                            <Trash2 size={18} /> Clear
                        </button>
                    </div>
                </div>

                {/* Canvas Container */}
                <div className="relative border-2 border-base-300 rounded-lg overflow-hidden bg-white cursor-crosshair touch-none" style={{ minHeight: '600px' }}>
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawingReliable}
                        onMouseUp={finishDrawing}
                        onMouseMove={drawReliable}
                        onMouseLeave={finishDrawing}
                        onTouchStart={startDrawingReliable}
                        onTouchEnd={finishDrawing}
                        onTouchMove={drawReliable}
                        className="w-full h-full"
                    />
                </div>

                {/* Close Button */}
                <button
                    onClick={closeWhiteboard}
                    className="absolute top-4 right-4 btn btn-circle btn-sm btn-ghost text-black hover:bg-black/10"
                >
                    <X size={24} />
                </button>
            </div>
        </div>
    );
};

export default WhiteboardModal;
