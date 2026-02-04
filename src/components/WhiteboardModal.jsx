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

        // Make canvas responsive - use container size
        const updateCanvasSize = () => {
            const container = canvas.parentElement;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            // Set canvas internal resolution to match display size
            canvas.width = rect.width;
            canvas.height = rect.height;

            // Reapply context settings after resize
            const ctx = canvas.getContext('2d');
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
            ctx.lineWidth = lineWidth;
            ctxRef.current = ctx;
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);

        const ctx = canvas.getContext('2d');
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round'; // Smooth joins
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
            window.removeEventListener('resize', updateCanvasSize);
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
        const canvas = canvasRef.current;
        if (!canvas) return { offsetX: 0, offsetY: 0 };

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        if (nativeEvent.touches && nativeEvent.touches.length > 0) {
            return {
                offsetX: (nativeEvent.touches[0].clientX - rect.left) * scaleX,
                offsetY: (nativeEvent.touches[0].clientY - rect.top) * scaleY
            };
        }

        // Mouse events: offsetX is properly relative to the element, but in CSS pixels.
        // We need to scale it to canvas internal pixels.
        return {
            offsetX: nativeEvent.offsetX * scaleX,
            offsetY: nativeEvent.offsetY * scaleY
        };
    };

    // Re-implementing drawing with specific coordinate tracking for reliable emission
    const lastPos = useRef({ x: 0, y: 0 });
    const prevPos = useRef({ x: 0, y: 0 }); // For smooth curves

    const startDrawingReliable = (e) => {
        // Prevent scrolling on touch devices
        if (e.type === 'touchstart') {
            e.preventDefault();
        }

        const { offsetX, offsetY } = getCoords(e.nativeEvent);
        lastPos.current = { x: offsetX, y: offsetY };
        prevPos.current = { x: offsetX, y: offsetY };

        // Start new path
        const ctx = ctxRef.current;
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);

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

        // Use quadratic curve for smoother drawing
        const midX = (lastPos.current.x + offsetX) / 2;
        const midY = (lastPos.current.y + offsetY) / 2;

        ctx.quadraticCurveTo(lastPos.current.x, lastPos.current.y, midX, midY);
        ctx.stroke();

        // Emit for real-time sync
        if (socket && selectedUser) {
            socket.emit("whiteboard-draw", {
                to: selectedUser._id,
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
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-base-100 rounded-xl shadow-2xl flex flex-col gap-3 relative w-full h-full sm:h-auto sm:max-w-5xl border border-base-300 max-h-screen overflow-hidden">

                {/* Header / Tools */}
                <div className="flex flex-col sm:flex-row justify-between items-center bg-base-300 px-3 py-2 rounded-xl gap-2 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex gap-3 items-center">
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                disabled={tool === 'eraser'}
                                className="w-10 h-10 cursor-pointer rounded-lg overflow-hidden border-2 border-base-content/20 p-0"
                                title="Choose Color"
                            />
                            <div className="flex flex-col justify-center w-24">
                                <span className="text-xs font-medium text-base-content/70 mb-1">Size: {lineWidth}px</span>
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

                        <div className="flex gap-2 border-l pl-4 border-base-content/10">
                            <button
                                onClick={() => setTool('pen')}
                                className={`btn btn-sm btn-circle ${tool === 'pen' ? 'btn-primary' : 'btn-ghost'}`}
                                title="Pen Tool"
                            >
                                <Pen size={18} />
                            </button>
                            <button
                                onClick={() => setTool('eraser')}
                                className={`btn btn-sm btn-circle ${tool === 'eraser' ? 'btn-primary' : 'btn-ghost'}`}
                                title="Eraser Tool"
                            >
                                <Eraser size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                        <button
                            onClick={clearCanvas}
                            className="btn btn-sm btn-error text-white shadow-sm"
                            title="Clear Canvas"
                        >
                            <Trash2 size={16} /> Clear
                        </button>
                    </div>
                </div>

                {/* Canvas Container */}
                <div className="relative border-2 border-base-300 rounded-lg overflow-hidden bg-white cursor-crosshair flex-1" style={{ minHeight: '400px' }}>
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawingReliable}
                        onMouseUp={finishDrawing}
                        onMouseMove={drawReliable}
                        onMouseLeave={finishDrawing}
                        onTouchStart={startDrawingReliable}
                        onTouchEnd={finishDrawing}
                        onTouchMove={drawReliable}
                        className="w-full h-full block"
                        style={{ touchAction: 'none' }}
                    />
                </div>

                {/* Close Button */}
                <button
                    onClick={closeWhiteboard}
                    className="absolute -top-3 -right-3 btn btn-circle btn-sm btn-error text-white shadow-lg z-50 border-2 border-white"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};

export default WhiteboardModal;
