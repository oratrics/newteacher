    // // components/WhiteboardComponent.jsx - Self-contained whiteboard
    // import React, { useRef, useEffect, useState, useCallback } from 'react';
    // import './WhiteboardComponent.css';

    // const WhiteboardComponent = ({ 
    //   channelName, 
    //   userId, 
    //   userRole, 
    //   onClose,
    //   isTeacher = false 
    // }) => {
    //   const canvasRef = useRef(null);
    //   const [isDrawing, setIsDrawing] = useState(false);
    //   const [tool, setTool] = useState('pen');
    //   const [color, setColor] = useState('#000000');
    //   const [brushSize, setBrushSize] = useState(3);
    //   const [isErasing, setIsErasing] = useState(false);

    //   // Drawing state
    //   const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });

    //   // Initialize canvas
    //   useEffect(() => {
    //     const canvas = canvasRef.current;
    //     if (!canvas) return;

    //     const ctx = canvas.getContext('2d');
        
    //     // Set canvas size
    //     const resizeCanvas = () => {
    //       const container = canvas.parentElement;
    //       canvas.width = container.offsetWidth;
    //       canvas.height = container.offsetHeight;
        
    //       // Set drawing properties
    //       ctx.lineCap = 'round';
    //       ctx.lineJoin = 'round';
    //       ctx.strokeStyle = color;
    //       ctx.lineWidth = brushSize;
        
    //       // Clear canvas with white background
    //       ctx.fillStyle = '#ffffff';
    //       ctx.fillRect(0, 0, canvas.width, canvas.height);
    //     };

    //     resizeCanvas();
    //     window.addEventListener('resize', resizeCanvas);

    //     return () => {
    //       window.removeEventListener('resize', resizeCanvas);
    //     };
    //   }, [color, brushSize]);

    //   // Get mouse/touch position
    //   const getPosition = useCallback((event) => {
    //     const canvas = canvasRef.current;
    //     const rect = canvas.getBoundingClientRect();
        
    //     let clientX, clientY;
        
    //     if (event.touches) {
    //       clientX = event.touches[0].clientX;
    //       clientY = event.touches[0].clientY;
    //     } else {
    //       clientX = event.clientX;
    //       clientY = event.clientY;
    //     }
        
    //     return {
    //       x: clientX - rect.left,
    //       y: clientY - rect.top
    //     };
    //   }, []);

    //   // Start drawing
    //   const startDrawing = useCallback((event) => {
    //     if (!isTeacher && userRole !== 'teacher') return; // Only teachers can draw
        
    //     event.preventDefault();
    //     setIsDrawing(true);
    //     const position = getPosition(event);
    //     setLastPosition(position);
    //   }, [isTeacher, userRole, getPosition]);

    //   // Draw function
    //   const draw = useCallback((event) => {
    //     if (!isDrawing) return;
    //     if (!isTeacher && userRole !== 'teacher') return;
        
    //     event.preventDefault();
    //     const canvas = canvasRef.current;
    //     const ctx = canvas.getContext('2d');
    //     const currentPosition = getPosition(event);

    //     ctx.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over';
    //     ctx.strokeStyle = isErasing ? 'rgba(0,0,0,1)' : color;
    //     ctx.lineWidth = isErasing ? brushSize * 2 : brushSize;

    //     ctx.beginPath();
    //     ctx.moveTo(lastPosition.x, lastPosition.y);
    //     ctx.lineTo(currentPosition.x, currentPosition.y);
    //     ctx.stroke();

    //     setLastPosition(currentPosition);
    //   }, [isDrawing, isTeacher, userRole, getPosition, lastPosition, color, brushSize, isErasing]);

    //   // Stop drawing
    //   const stopDrawing = useCallback(() => {
    //     setIsDrawing(false);
    //   }, []);

    //   // Tool handlers
    //   const handleToolChange = useCallback((newTool) => {
    //     setTool(newTool);
    //     setIsErasing(newTool === 'eraser');
    //   }, []);

    //   const handleColorChange = useCallback((newColor) => {
    //     setColor(newColor);
    //     setIsErasing(false);
    //     setTool('pen');
    //   }, []);

    //   const handleBrushSizeChange = useCallback((newSize) => {
    //     setBrushSize(parseInt(newSize));
    //   }, []);

    //   const clearCanvas = useCallback(() => {
    //     if (!isTeacher && userRole !== 'teacher') return;
        
    //     const canvas = canvasRef.current;
    //     const ctx = canvas.getContext('2d');
    //     ctx.fillStyle = '#ffffff';
    //     ctx.fillRect(0, 0, canvas.width, canvas.height);
    //   }, [isTeacher, userRole]);

    //   // Keyboard shortcuts
    //   useEffect(() => {
    //     const handleKeyPress = (event) => {
    //       if (!isTeacher && userRole !== 'teacher') return;
        
    //       switch (event.key.toLowerCase()) {
    //         case 'p':
    //           if (event.ctrlKey) {
    //             event.preventDefault();
    //             handleToolChange('pen');
    //           }
    //           break;
    //         case 'e':
    //           if (event.ctrlKey) {
    //             event.preventDefault();
    //             handleToolChange('eraser');
    //           }
    //           break;
    //         case 'c':
    //           if (event.ctrlKey && event.shiftKey) {
    //             event.preventDefault();
    //             clearCanvas();
    //           }
    //           break;
    //         case 'escape':
    //           onClose();
    //           break;
    //       }
    //     };

    //     window.addEventListener('keydown', handleKeyPress);
    //     return () => window.removeEventListener('keydown', handleKeyPress);
    //   }, [isTeacher, userRole, handleToolChange, clearCanvas, onClose]);

    //   return (
    //     <div className="whiteboard-overlay">
    //       <div className="whiteboard-container">
    //         {/* Header */}
    //         <div className="whiteboard-header">
    //           <div className="whiteboard-title">
    //             <h3>Whiteboard</h3>
    //             {(!isTeacher && userRole !== 'teacher') && (
    //               <span className="view-only-badge">View Only</span>
    //             )}
    //           </div>
            
    //           <button onClick={onClose} className="whiteboard-close-btn">
    //             ✕
    //           </button>
    //         </div>

    //         {/* Toolbar */}
    //         {(isTeacher || userRole === 'teacher') && (
    //           <div className="whiteboard-toolbar">
    //             {/* Tools */}
    //             <div className="toolbar-section">
    //               <button
    //                 className={`tool-btn ${tool === 'pen' ? 'active' : ''}`}
    //                 onClick={() => handleToolChange('pen')}
    //                 title="Pen (Ctrl+P)"
    //               >
    //                 ✏️
    //               </button>
    //               <button
    //                 className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
    //                 onClick={() => handleToolChange('eraser')}
    //                 title="Eraser (Ctrl+E)"
    //               >
    //                 🧹
    //               </button>
    //             </div>

    //             {/* Colors */}
    //             <div className="toolbar-section">
    //               {['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map((colorOption) => (
    //                 <button
    //                   key={colorOption}
    //                   className={`color-btn ${color === colorOption ? 'active' : ''}`}
    //                   style={{ backgroundColor: colorOption }}
    //                   onClick={() => handleColorChange(colorOption)}
    //                   title={`Color: ${colorOption}`}
    //                 />
    //               ))}
    //             </div>

    //             {/* Brush Size */}
    //             <div className="toolbar-section">
    //               <label className="brush-size-label">
    //                 Size: {brushSize}px
    //                 <input
    //                   type="range"
    //                   min="1"
    //                   max="20"
    //                   value={brushSize}
    //                   onChange={(e) => handleBrushSizeChange(e.target.value)}
    //                   className="brush-size-slider"
    //                 />
    //               </label>
    //             </div>

    //             {/* Actions */}
    //             <div className="toolbar-section">
    //               <button
    //                 onClick={clearCanvas}
    //                 className="clear-btn"
    //                 title="Clear Canvas (Ctrl+Shift+C)"
    //               >
    //                 🗑️ Clear
    //               </button>
    //             </div>
    //           </div>
    //         )}

    //         {/* Canvas */}
    //         <div className="whiteboard-canvas-container">
    //           <canvas
    //             ref={canvasRef}
    //             className="whiteboard-canvas"
    //             onMouseDown={startDrawing}
    //             onMouseMove={draw}
    //             onMouseUp={stopDrawing}
    //             onMouseLeave={stopDrawing}
    //             onTouchStart={startDrawing}
    //             onTouchMove={draw}
    //             onTouchEnd={stopDrawing}
    //             style={{ 
    //               cursor: isTeacher || userRole === 'teacher' 
    //                 ? (isErasing ? 'crosshair' : 'crosshair') 
    //                 : 'default'
    //             }}
    //           />
            
    //           {/* Overlay message for students */}
    //           {(!isTeacher && userRole !== 'teacher') && (
    //             <div className="canvas-overlay-message">
    //               <p>👀 View-only mode</p>
    //               <p>Only teachers can draw on the whiteboard</p>
    //             </div>
    //           )}
    //         </div>

    //         {/* Instructions */}
    //         {(isTeacher || userRole === 'teacher') && (
    //           <div className="whiteboard-instructions">
    //             <p>
    //               <strong>Shortcuts:</strong> 
    //               Ctrl+P (Pen) • Ctrl+E (Eraser) • Ctrl+Shift+C (Clear) • Esc (Close)
    //             </p>
    //           </div>
    //         )}
    //       </div>
    //     </div>
    //   );
    // };

    // export default WhiteboardComponent;

    // components/WhiteboardComponent.jsx - BULLETPROOF WHITEBOARD
    import React, { 
    useRef, 
    useEffect, 
    useState, 
    useCallback,
    useMemo 
    } from 'react';
    import './WhiteboardComponent.css';

    const WhiteboardComponent = ({
    userId = 'default-user',
    userName = 'User',
    isTeacher = false,
    onClose = () => {},
    width = 1200,
    height = 800,
    backgroundColor = '#ffffff'
    }) => {
    // Refs
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const isDrawingRef = useRef(false);
    const lastPosRef = useRef({ x: 0, y: 0 });
    const pathRef = useRef([]);
    const undoStackRef = useRef([]);
    const redoStackRef = useRef([]);

    // Drawing state
    const [tool, setTool] = useState('pen'); // pen, eraser, line, rectangle, circle, text
    const [color, setColor] = useState('#000000');
    const [size, setSize] = useState(3);
    const [isDrawing, setIsDrawing] = useState(false);
    
    // Text state
    const [textMode, setTextMode] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
    
    // Shape state
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [shapes, setShapes] = useState([]);
    
    // UI state
    const [showToolbar, setShowToolbar] = useState(true);
    const [showColorPicker, setShowColorPicker] = useState(false);
    
    // Available tools
    const tools = useMemo(() => [
        { id: 'pen', name: 'Pen', icon: '✏️', teacherOnly: false },
        { id: 'eraser', name: 'Eraser', icon: '🧽', teacherOnly: false },
        { id: 'line', name: 'Line', icon: '📏', teacherOnly: true },
        { id: 'rectangle', name: 'Rectangle', icon: '⬜', teacherOnly: true },
        { id: 'circle', name: 'Circle', icon: '⭕', teacherOnly: true },
        { id: 'text', name: 'Text', icon: '📝', teacherOnly: true },
        { id: 'select', name: 'Select', icon: '👆', teacherOnly: true }
    ], []);

    // Colors
    const colors = [
        '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
        '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080',
        '#ffc0cb', '#a52a2a', '#808080', '#000080', '#008000'
    ];

    // Sizes
    const sizes = [1, 2, 3, 5, 8, 12, 16, 20];

    // Initialize canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = color;
        context.lineWidth = size;
        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, width, height);
        
        contextRef.current = context;

        // Save initial state
        saveState();
    }, [width, height, backgroundColor]);

    // Update drawing properties
    useEffect(() => {
        if (contextRef.current) {
        contextRef.current.strokeStyle = tool === 'eraser' ? backgroundColor : color;
        contextRef.current.lineWidth = tool === 'eraser' ? size * 3 : size;
        }
    }, [tool, color, size, backgroundColor]);

    // Save state for undo/redo
    const saveState = useCallback(() => {
        if (!canvasRef.current) return;
        
        const imageData = canvasRef.current.toDataURL();
        undoStackRef.current.push(imageData);
        
        // Limit undo stack to 50 states
        if (undoStackRef.current.length > 50) {
        undoStackRef.current.shift();
        }
        
        // Clear redo stack
        redoStackRef.current = [];
    }, []);

    // Undo function
    const undo = useCallback(() => {
        if (undoStackRef.current.length > 1) {
        const currentState = undoStackRef.current.pop();
        redoStackRef.current.push(currentState);
        
        const previousState = undoStackRef.current[undoStackRef.current.length - 1];
        restoreState(previousState);
        }
    }, []);

    // Redo function
    const redo = useCallback(() => {
        if (redoStackRef.current.length > 0) {
        const nextState = redoStackRef.current.pop();
        undoStackRef.current.push(nextState);
        restoreState(nextState);
        }
    }, []);

    // Restore canvas state
    const restoreState = useCallback((imageData) => {
        const canvas = canvasRef.current;
        const context = contextRef.current;
        if (!canvas || !context) return;

        const img = new Image();
        img.onload = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0);
        };
        img.src = imageData;
    }, []);

    // Get mouse position
    const getMousePos = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
        };
    }, []);

    // Start drawing
    const startDrawing = useCallback((e) => {
        if (!contextRef.current || textMode) return;

        const pos = getMousePos(e);
        isDrawingRef.current = true;
        lastPosRef.current = pos;
        setStartPos(pos);
        setIsDrawing(true);

        // Start new path
        pathRef.current = [pos];

        if (tool === 'pen' || tool === 'eraser') {
        contextRef.current.beginPath();
        contextRef.current.moveTo(pos.x, pos.y);
        }
    }, [getMousePos, tool, textMode]);

    // Continue drawing
    const draw = useCallback((e) => {
        if (!isDrawingRef.current || !contextRef.current || textMode) return;

        const pos = getMousePos(e);
        const context = contextRef.current;

        if (tool === 'pen' || tool === 'eraser') {
        // Free drawing
        context.lineTo(pos.x, pos.y);
        context.stroke();
        context.beginPath();
        context.moveTo(pos.x, pos.y);
        
        pathRef.current.push(pos);
        } else if (tool === 'line' || tool === 'rectangle' || tool === 'circle') {
        // Shape drawing with preview
        redrawCanvas();
        drawShape(startPos, pos, tool);
        }

        lastPosRef.current = pos;
    }, [getMousePos, tool, startPos, textMode]);

    // Stop drawing
    const stopDrawing = useCallback(() => {
        if (!isDrawingRef.current) return;

        isDrawingRef.current = false;
        setIsDrawing(false);

        if (tool === 'line' || tool === 'rectangle' || tool === 'circle') {
        // Finalize shape
        const newShape = {
            id: Date.now(),
            type: tool,
            startPos,
            endPos: lastPosRef.current,
            color: color,
            size: size
        };
        setShapes(prev => [...prev, newShape]);
        }

        // Save state for undo
        saveState();
    }, [tool, startPos, color, size, saveState]);

    // Draw shape
    const drawShape = useCallback((start, end, shapeType) => {
        const context = contextRef.current;
        if (!context) return;

        context.beginPath();

        switch (shapeType) {
        case 'line':
            context.moveTo(start.x, start.y);
            context.lineTo(end.x, end.y);
            context.stroke();
            break;

        case 'rectangle':
            const width = end.x - start.x;
            const height = end.y - start.y;
            context.strokeRect(start.x, start.y, width, height);
            break;

        case 'circle':
            const radius = Math.sqrt(
            Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
            );
            context.arc(start.x, start.y, radius, 0, 2 * Math.PI);
            context.stroke();
            break;
        }
    }, []);

    // Redraw canvas
    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const context = contextRef.current;
        if (!canvas || !context) return;

        // Get current state from undo stack
        if (undoStackRef.current.length > 0) {
        const currentState = undoStackRef.current[undoStackRef.current.length - 1];
        restoreState(currentState);
        }
    }, [restoreState]);

    // Handle text placement
    const handleCanvasClick = useCallback((e) => {
        if (tool === 'text' && !textMode) {
        const pos = getMousePos(e);
        setTextPosition(pos);
        setTextMode(true);
        }
    }, [tool, textMode, getMousePos]);

    // Add text to canvas
    const addText = useCallback(() => {
        if (!textInput.trim() || !contextRef.current) return;

        const context = contextRef.current;
        context.font = `${size * 3}px Arial`;
        context.fillStyle = color;
        context.fillText(textInput, textPosition.x, textPosition.y);

        setTextMode(false);
        setTextInput('');
        saveState();
    }, [textInput, textPosition, color, size, saveState]);

    // Clear canvas
    const clearCanvas = useCallback(() => {
        if (!contextRef.current) return;

        const context = contextRef.current;
        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, width, height);
        
        setShapes([]);
        saveState();
    }, [backgroundColor, width, height, saveState]);

    // Save whiteboard as image
    const saveWhiteboard = useCallback(() => {
        if (!canvasRef.current) return;

        const link = document.createElement('a');
        link.download = `whiteboard-${Date.now()}.png`;
        link.href = canvasRef.current.toDataURL();
        link.click();
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
            case 'z':
                e.preventDefault();
                if (e.shiftKey) {
                redo();
                } else {
                undo();
                }
                break;
            case 's':
                e.preventDefault();
                saveWhiteboard();
                break;
            case 'c':
                e.preventDefault();
                if (isTeacher) clearCanvas();
                break;
            }
        }

        // Tool shortcuts
        if (!textMode) {
            switch (e.key) {
            case '1': setTool('pen'); break;
            case '2': setTool('eraser'); break;
            case '3': if (isTeacher) setTool('line'); break;
            case '4': if (isTeacher) setTool('rectangle'); break;
            case '5': if (isTeacher) setTool('circle'); break;
            case '6': if (isTeacher) setTool('text'); break;
            case 'Escape': 
                setTextMode(false);
                setShowColorPicker(false);
                break;
            }
        }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [undo, redo, saveWhiteboard, clearCanvas, isTeacher, textMode]);

    // Touch support for mobile
    const handleTouchStart = useCallback((e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
        });
        canvasRef.current?.dispatchEvent(mouseEvent);
    }, []);

    const handleTouchMove = useCallback((e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
        });
        canvasRef.current?.dispatchEvent(mouseEvent);
    }, []);

    const handleTouchEnd = useCallback((e) => {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup', {});
        canvasRef.current?.dispatchEvent(mouseEvent);
    }, []);

    return (
        <div className="whiteboard-container">
        {/* Header */}
        <div className="whiteboard-header">
            <div className="header-left">
            <h3>📝 Whiteboard</h3>
            <span className="user-info">
                {userName} {isTeacher ? '(Teacher)' : '(Student)'}
            </span>
            </div>
            
            <div className="header-right">
            <button
                className="toolbar-toggle"
                onClick={() => setShowToolbar(!showToolbar)}
                title="Toggle Toolbar"
            >
                {showToolbar ? '🔼' : '🔽'}
            </button>
            
            <button
                className="close-btn"
                onClick={onClose}
                title="Close Whiteboard"
            >
                ✕
            </button>
            </div>
        </div>

        {/* Toolbar */}
        {showToolbar && (
            <div className="whiteboard-toolbar">
            {/* Tools */}
            <div className="toolbar-group">
                <label>Tools:</label>
                {tools.map(toolItem => {
                if (toolItem.teacherOnly && !isTeacher) return null;
                
                return (
                    <button
                    key={toolItem.id}
                    className={`tool-btn ${tool === toolItem.id ? 'active' : ''}`}
                    onClick={() => {
                        setTool(toolItem.id);
                        setTextMode(false);
                    }}
                    title={`${toolItem.name} (${tools.indexOf(toolItem) + 1})`}
                    disabled={toolItem.teacherOnly && !isTeacher}
                    >
                    <span className="tool-icon">{toolItem.icon}</span>
                    <span className="tool-name">{toolItem.name}</span>
                    </button>
                );
                })}
            </div>

            {/* Colors */}
            <div className="toolbar-group">
                <label>Color:</label>
                <div className="color-picker-container">
                <button
                    className="current-color"
                    style={{ backgroundColor: color }}
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    title="Select Color"
                />
                
                {showColorPicker && (
                    <div className="color-palette">
                    {colors.map(colorOption => (
                        <button
                        key={colorOption}
                        className={`color-option ${color === colorOption ? 'selected' : ''}`}
                        style={{ backgroundColor: colorOption }}
                        onClick={() => {
                            setColor(colorOption);
                            setShowColorPicker(false);
                        }}
                        title={colorOption}
                        />
                    ))}
                    </div>
                )}
                </div>
                
                <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                title="Custom Color"
                className="custom-color-picker"
                />
            </div>

            {/* Size */}
            <div className="toolbar-group">
                <label>Size:</label>
                <select
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                title="Brush Size"
                >
                {sizes.map(sizeOption => (
                    <option key={sizeOption} value={sizeOption}>
                    {sizeOption}px
                    </option>
                ))}
                </select>
                
                <input
                type="range"
                min="1"
                max="50"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                title="Size Slider"
                className="size-slider"
                />
            </div>

            {/* Actions */}
            <div className="toolbar-group">
                <button
                onClick={undo}
                disabled={undoStackRef.current.length <= 1}
                title="Undo (Ctrl+Z)"
                className="action-btn"
                >
                ↶ Undo
                </button>
                
                <button
                onClick={redo}
                disabled={redoStackRef.current.length === 0}
                title="Redo (Ctrl+Shift+Z)"
                className="action-btn"
                >
                ↷ Redo
                </button>
                
                {isTeacher && (
                <button
                    onClick={clearCanvas}
                    title="Clear All (Ctrl+C)"
                    className="action-btn danger"
                >
                    🗑️ Clear
                </button>
                )}
                
                <button
                onClick={saveWhiteboard}
                title="Save (Ctrl+S)"
                className="action-btn success"
                >
                💾 Save
                </button>
            </div>
            </div>
        )}

        {/* Canvas Container */}
        <div className="canvas-container">
            <canvas
            ref={canvasRef}
            className="whiteboard-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onClick={handleCanvasClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ cursor: tool === 'eraser' ? 'crosshair' : 'default' }}
            />

            {/* Text Input Overlay */}
            {textMode && (
            <div
                className="text-input-overlay"
                style={{
                position: 'absolute',
                left: textPosition.x,
                top: textPosition.y,
                zIndex: 10
                }}
            >
                <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                    addText();
                    } else if (e.key === 'Escape') {
                    setTextMode(false);
                    setTextInput('');
                    }
                }}
                onBlur={addText}
                autoFocus
                placeholder="Enter text..."
                style={{
                    fontSize: `${size * 3}px`,
                    color: color,
                    border: '2px dashed #ccc',
                    background: 'rgba(255, 255, 255, 0.9)',
                    padding: '4px',
                    borderRadius: '4px'
                }}
                />
            </div>
            )}
        </div>

        {/* Status Bar */}
        <div className="whiteboard-status">
            <span>Tool: {tools.find(t => t.id === tool)?.name}</span>
            <span>Color: {color}</span>
            <span>Size: {size}px</span>
            <span>Canvas: {width}x{height}</span>
            {isDrawing && <span className="drawing-indicator">✏️ Drawing...</span>}
        </div>

        {/* Help Panel */}
        <div className="help-panel">
            <details>
            <summary>🔧 Shortcuts</summary>
            <div className="shortcuts">
                <div>1-6: Select tools</div>
                <div>Ctrl+Z: Undo</div>
                <div>Ctrl+Shift+Z: Redo</div>
                <div>Ctrl+S: Save</div>
                <div>Ctrl+C: Clear (Teacher only)</div>
                <div>Esc: Cancel text/close menus</div>
            </div>
            </details>
        </div>
        </div>
    );
    };

    export default WhiteboardComponent;
