import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Eraser } from 'lucide-react';

const ScratchReveal = ({ children, isMe }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isRevealed, setIsRevealed] = useState(isMe); // Sender sees it revealed (or semi-visible)
    const [isScratching, setIsScratching] = useState(false);

    useEffect(() => {
        if (isRevealed) return;

        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        const width = container.offsetWidth;
        const height = container.offsetHeight;

        canvas.width = width;
        canvas.height = height;

        // Fill with "Fog" - Gradient or Noise
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#9ca3af'); // Gray-400
        gradient.addColorStop(1, '#6b7280'); // Gray-500
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Add some noise or pattern
        for (let i = 0; i < 50; i++) {
            ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.2})`;
            ctx.beginPath();
            ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Text hint
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Scratch to Reveal', width / 2, height / 2);

    }, [isRevealed]);

    const handleScratch = (e) => {
        if (isRevealed) return;
        setIsScratching(true);

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();

        checkRevealProgress();
    };

    const checkRevealProgress = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        // Simple check every few scratches (optimization)
        if (Math.random() > 0.2) return;

        // Get pixel data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let transparentPixels = 0;

        // Check alpha channel of every 10th pixel for speed
        for (let i = 3; i < data.length; i += 40) {
            if (data[i] === 0) transparentPixels++;
        }

        const totalPixels = data.length / 40;
        if (transparentPixels / totalPixels > 0.4) { // 40% cleared
            setIsRevealed(true);
        }
    };

    return (
        <div ref={containerRef} className="relative overflow-hidden rounded-xl select-none group">
            {/* The Hidden Content */}
            <div className={`transition-opacity duration-700 ${isRevealed ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'}`}>
                {children}
            </div>

            {/* The Overlay */}
            {!isRevealed && (
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 cursor-crosshair touch-none z-10"
                    onMouseDown={handleScratch}
                    onMouseMove={(e) => {
                        if (e.buttons === 1) handleScratch(e);
                    }}
                    onTouchMove={handleScratch}
                />
            )}

            {!isRevealed && !isScratching && (
                <div className="absolute top-2 right-2 z-20 pointer-events-none animate-pulse">
                    <Sparkles className="size-4 text-white" />
                </div>
            )}
        </div>
    );
};

export default ScratchReveal;
