document.addEventListener('DOMContentLoaded', () => {
    // --- DOM 요소 ---
    const mainCanvas = document.getElementById('main-canvas');
    const ctx = mainCanvas.getContext('2d');
    const tempCanvas = document.getElementById('temp-canvas');
    const tempCtx = tempCanvas.getContext('2d');
    const canvasContainer = document.getElementById('canvas-container');
    const panels = document.querySelectorAll('.panel.draggable');
    const coordsDisplay = document.getElementById('coords-display');
    const previewCanvas = document.getElementById('preview-canvas');
    const previewCtx = previewCanvas.getContext('2d');
    const colorPicker = document.getElementById('color-picker');
    const paletteContainer = document.getElementById('color-palette');
    const recentColorsContainer = document.getElementById('recent-colors');
    const toolButtons = document.querySelectorAll('.tool');
    const canvasSizeSelector = document.getElementById('canvas-size');
    const gridToggle = document.getElementById('grid-toggle');
    const layerList = document.getElementById('layer-list');
    const addLayerBtn = document.getElementById('add-layer-btn');
    const removeLayerBtn = document.getElementById('remove-layer-btn');
    const duplicateLayerBtn = document.getElementById('duplicate-layer-btn');
    const moveLayerUpBtn = document.getElementById('move-layer-up-btn');
    const moveLayerDownBtn = document.getElementById('move-layer-down-btn');
    const frameList = document.getElementById('frame-list');
    const addFrameBtn = document.getElementById('add-frame-btn');
    const copyFrameBtn = document.getElementById('copy-frame-btn');
    const removeFrameBtn = document.getElementById('remove-frame-btn');
    const playAnimationBtn = document.getElementById('play-animation-btn');
    const fpsSlider = document.getElementById('fps-slider');
    const fpsValue = document.getElementById('fps-value');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const brushSizeInput = document.getElementById('brush-size');
    const symmetryModeSelect = document.getElementById('symmetry-mode');
    const saveProjectBtn = document.getElementById('save-project-btn');
    const loadProjectBtn = document.getElementById('load-project-btn');
    const loadProjectInput = document.getElementById('load-project-input');
    const exportPngBtn = document.getElementById('export-png-btn');
    const exportGifBtn = document.getElementById('export-gif-btn');
    const shortcutsModal = document.getElementById('shortcuts-modal');
    const shortcutsButton = document.getElementById('shortcuts-button');
    const closeModal = document.querySelector('.close-button');

    // --- 상태 변수 ---
    let state = {
        canvasWidth: 32, canvasHeight: 32,
        zoom: 12, panX: 0, panY: 0,
        isPanning: false, isDrawing: false,
        startCoords: null, lastDrawCoords: null,
        currentTool: 'pen', currentColor: '#000000',
        brushSize: 1, showGrid: true,
        symmetryMode: 'none',
        recentColors: [],
        layers: [], activeLayerIndex: 0,
        frames: [], activeFrameIndex: 0,
        isPlaying: false,
        history: [], historyIndex: -1,
        nextLayerId: 1,
    };

    const createBlankCanvas = () => { const c = document.createElement('canvas'); c.width = state.canvasWidth; c.height = state.canvasHeight; return c; };

    function init() {
        setupEventListeners();
        resetApplication();
        createDefaultPalette();
    }

    function resetApplication() {
        if (state.isPlaying) toggleAnimation();
        state.canvasWidth = parseInt(canvasSizeSelector.value);
        state.canvasHeight = parseInt(canvasSizeSelector.value);
        mainCanvas.width = tempCanvas.width = state.canvasWidth;
        mainCanvas.height = tempCanvas.height = state.canvasHeight;
        tempCanvas.width = mainCanvas.width;
        tempCanvas.height = mainCanvas.height;

        state.layers = []; state.frames = []; state.history = [];
        state.historyIndex = -1; state.nextLayerId = 1; state.brushSize = 1;
        brushSizeInput.value = 1; state.recentColors = []; renderRecentColors();

        addNewLayer();
        addNewFrame();

        state.activeLayerIndex = 0;
        state.activeFrameIndex = 0;

        centerCanvas();
        renderLayerList();
        renderFrameList();
        saveHistory();
    }

    function centerCanvas() {
        state.panX = (canvasContainer.clientWidth - mainCanvas.width * state.zoom) / 2;
        state.panY = (canvasContainer.clientHeight - mainCanvas.height * state.zoom) / 2;
        updateCanvasTransform();
    }
    
    function updateCanvasTransform() {
        const transform = `scale(${state.zoom})`;
        mainCanvas.style.transform = tempCanvas.style.transform = transform;
        mainCanvas.style.left = tempCanvas.style.left = `${state.panX}px`;
        mainCanvas.style.top = tempCanvas.style.top = `${state.panY}px`;
        drawCombinedCanvas();
    }

    function setupEventListeners() {
        window.addEventListener('resize', centerCanvas);
        panels.forEach(makeDraggable);
        canvasContainer.addEventListener('mousedown', handleMouseDown);
        canvasContainer.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        canvasContainer.addEventListener('mouseleave', () => { coordsDisplay.style.display = 'none'; });
        canvasContainer.addEventListener('mouseenter', () => coordsDisplay.style.display = 'block');
        canvasContainer.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        toolButtons.forEach(button => button.addEventListener('click', () => setActiveTool(button.dataset.tool)));
        colorPicker.addEventListener('input', e => state.currentColor = e.target.value);
        colorPicker.addEventListener('change', e => addToRecentColors(e.target.value));
        canvasSizeSelector.addEventListener('change', () => { if (confirm('캔버스 크기를 변경하면 현재 작업 내용이 사라집니다. 계속하시겠습니까?')) { resetApplication(); } else { canvasSizeSelector.value = state.canvasWidth; } });
        gridToggle.addEventListener('change', (e) => { state.showGrid = e.target.checked; drawCombinedCanvas(); });
        addLayerBtn.addEventListener('click', () => { addNewLayer(); saveHistory(); });
        removeLayerBtn.addEventListener('click', () => { removeLayer(); saveHistory(); });
        duplicateLayerBtn.addEventListener('click', () => { duplicateLayer(); saveHistory(); });
        moveLayerUpBtn.addEventListener('click', () => { moveLayer(-1); saveHistory(); });
        moveLayerDownBtn.addEventListener('click', () => { moveLayer(1); saveHistory(); });
        addFrameBtn.addEventListener('click', () => { addNewFrame(); saveHistory(); });
        copyFrameBtn.addEventListener('click', () => { copyFrame(); saveHistory(); });
        removeFrameBtn.addEventListener('click', () => { removeFrame(); saveHistory(); });
        playAnimationBtn.addEventListener('click', toggleAnimation);
        fpsSlider.addEventListener('input', e => fpsValue.textContent = e.target.value);
        undoBtn.addEventListener('click', undo);
        redoBtn.addEventListener('click', redo);
        brushSizeInput.addEventListener('change', (e) => { state.brushSize = Math.max(1, parseInt(e.target.value, 10)); });
        symmetryModeSelect.addEventListener('change', (e) => state.symmetryMode = e.target.value);
        saveProjectBtn.addEventListener('click', saveProject);
        loadProjectBtn.addEventListener('click', () => loadProjectInput.click());
        loadProjectInput.addEventListener('change', loadProject);
        exportPngBtn.addEventListener('click', exportPNG);
        exportGifBtn.addEventListener('click', exportGIF);
        shortcutsButton.addEventListener('click', () => shortcutsModal.style.display = 'flex');
        closeModal.addEventListener('click', () => shortcutsModal.style.display = 'none');
        window.addEventListener('click', e => { if (e.target == shortcutsModal) shortcutsModal.style.display = 'none'; });
    }

    function handleMouseDown(e) {
        if (e.target.closest('.panel')) return;
        if (e.button === 1 || e.ctrlKey) {
            state.isPanning = true;
            canvasContainer.style.cursor = 'grabbing';
            return;
        }
        if (e.button !== 0) return;

        state.isDrawing = true;
        const coords = getCanvasCoords(e);
        state.startCoords = coords;
        state.lastDrawCoords = coords;

        const activeLayerCtx = getActiveLayerCanvas()?.getContext('2d');
        if (!activeLayerCtx) { state.isDrawing = false; return; }

        if (['pen', 'eraser'].includes(state.currentTool)) {
            drawOnLayer(coords.x, coords.y, activeLayerCtx);
        } else if (state.currentTool === 'eyedropper') {
            pickColor(coords.x, coords.y);
            state.isDrawing = false;
        } else if (state.currentTool === 'bucket') {
            floodFill(coords.x, coords.y);
            drawOnCanvas();
            saveHistory(); // Bucket fill is a single action
            state.isDrawing = false;
        }
    }

    function handleMouseMove(e) {
        const coords = getCanvasCoords(e);
        if (coords.x >= 0 && coords.x < state.canvasWidth && coords.y >= 0 && coords.y < state.canvasHeight) {
            coordsDisplay.textContent = `X: ${coords.x}, Y: ${coords.y}`;
        }
        
        if (state.isPanning) {
            state.panX += e.movementX;
            state.panY += e.movementY;
            updateCanvasTransform();
            return;
        }
        if (!state.isDrawing) return;

        const activeLayerCtx = getActiveLayerCanvas()?.getContext('2d');
        if (!activeLayerCtx) return;

        if (['pen', 'eraser'].includes(state.currentTool)) {
            drawOnLayer(coords.x, coords.y, activeLayerCtx);
        } else if (['line', 'rectangle', 'circle'].includes(state.currentTool)) {
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
            drawSymmetricalShape(state.startCoords.x, state.startCoords.y, coords.x, coords.y, tempCtx, state.currentTool);
        }
    }

    function handleMouseUp(e) {
        if (state.isPanning) {
            state.isPanning = false;
            canvasContainer.style.cursor = 'default';
        }

        if (!state.isDrawing) return;
        
        const coords = getCanvasCoords(e);
        const activeLayerCtx = getActiveLayerCanvas()?.getContext('2d');
        
        if (activeLayerCtx && ['line', 'rectangle', 'circle'].includes(state.currentTool)) {
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
            drawSymmetricalShape(state.startCoords.x, state.startCoords.y, coords.x, coords.y, activeLayerCtx, state.currentTool);
        }

        state.isDrawing = false;
        drawOnCanvas();
        saveHistory();
    }
    
    function handleWheel(e) { 
        e.preventDefault(); 
        const scaleAmount = 1.1;
        const rect = canvasContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const worldX = (mouseX - state.panX) / state.zoom;
        const worldY = (mouseY - state.panY) / state.zoom;
        
        const newZoom = e.deltaY > 0 ? state.zoom / scaleAmount : state.zoom * scaleAmount;
        state.zoom = Math.max(0.5, Math.min(64, newZoom));
        
        state.panX = mouseX - worldX * state.zoom;
        state.panY = mouseY - worldY * state.zoom;
        
        updateCanvasTransform();
    }
    
    function handleKeyDown(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const ctrlKey = isMac ? e.metaKey : e.ctrlKey;
        if (ctrlKey) {
            if (e.code === 'KeyZ') { e.preventDefault(); undo(); }
            if (e.code === 'KeyY') { e.preventDefault(); redo(); }
            return;
        }
        if (e.code === 'Space' && !state.isDrawing) { 
            e.preventDefault();
            if (!state.isPanning) {
                state.isPanning = true; 
                canvasContainer.style.cursor = 'grab';
            }
            return; 
        }
        const toolMap = {'KeyP': 'pen', 'KeyE': 'eraser', 'KeyI': 'eyedropper', 'KeyB': 'bucket', 'KeyL': 'line', 'KeyR': 'rectangle', 'KeyC': 'circle'};
        if(toolMap[e.code]) setActiveTool(toolMap[e.code]);
    }
    
    function handleKeyUp(e) { 
        if (e.code === 'Space') { 
            state.isPanning = false; 
            canvasContainer.style.cursor = 'default'; 
        } 
    }

    function setActiveTool(toolName) {
        const targetButton = document.querySelector(`.tool[data-tool="${toolName}"]`);
        if (targetButton) {
            document.querySelector('.tool.active')?.classList.remove('active');
            targetButton.classList.add('active');
            state.currentTool = toolName;
        }
    }

    function getActiveLayerCanvas() {
        const activeLayer = state.layers[state.activeLayerIndex];
        return activeLayer ? state.frames[state.activeFrameIndex]?.layers[activeLayer.id] : null;
    }

    function getCanvasCoords(e) {
        const rect = mainCanvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / state.zoom);
        const y = Math.floor((e.clientY - rect.top) / state.zoom);
        return { x, y };
    }

    function drawOnCanvas() { drawCombinedCanvas(); }

    function drawOnLayer(x, y, ctx) {
        const points = getLinePoints(state.lastDrawCoords.x, state.lastDrawCoords.y, x, y);
        points.forEach(p => {
            drawSymmetricalShape(p.x, p.y, p.x, p.y, ctx, state.currentTool);
        });
        state.lastDrawCoords = { x, y };
        drawOnCanvas();
    }

    function drawSymmetricalShape(x0, y0, x1, y1, targetCtx, tool) {
        drawShape(x0, y0, x1, y1, targetCtx, tool);
        if (state.symmetryMode === 'vertical') {
            drawShape(state.canvasWidth - 1 - x0, y0, state.canvasWidth - 1 - x1, y1, targetCtx, tool);
        }
        if (state.symmetryMode === 'horizontal') {
            drawShape(x0, state.canvasHeight - 1 - y0, x1, state.canvasHeight - 1 - y1, targetCtx, tool);
        }
    }

    function drawShape(x0, y0, x1, y1, targetCtx, tool) {
        const isEraser = tool === 'eraser';
        targetCtx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
        targetCtx.fillStyle = isEraser ? '#000' : state.currentColor;

        if (tool === 'pen' || tool === 'eraser') {
            targetCtx.fillRect(x0 - Math.floor(state.brushSize / 2), y0 - Math.floor(state.brushSize / 2), state.brushSize, state.brushSize);
        } else if (tool === 'line') {
            getLinePoints(x0, y0, x1, y1).forEach(p => targetCtx.fillRect(p.x, p.y, 1, 1));
        } else if (tool === 'rectangle') {
            const minX = Math.min(x0, x1); const minY = Math.min(y0, y1);
            const w = Math.abs(x0 - x1); const h = Math.abs(y0 - y1);
            targetCtx.strokeRect(minX + 0.5, minY + 0.5, w, h);
        } else if (tool === 'circle') {
            const r = Math.round(Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2)));
            let x = r, y = 0, err = 0;
            while (x >= y) {
                targetCtx.fillRect(x0 + x, y0 + y, 1, 1); targetCtx.fillRect(x0 + y, y0 + x, 1, 1);
                targetCtx.fillRect(x0 - y, y0 + x, 1, 1); targetCtx.fillRect(x0 - x, y0 + y, 1, 1);
                targetCtx.fillRect(x0 - x, y0 - y, 1, 1); targetCtx.fillRect(x0 - y, y0 - x, 1, 1);
                targetCtx.fillRect(x0 + y, y0 - x, 1, 1); targetCtx.fillRect(x0 + x, y0 - y, 1, 1);
                y++; err += 1 + 2 * y;
                if (2 * (err - x) + 1 > 0) { x--; err += 1 - 2 * x; }
            }
        }
        targetCtx.globalCompositeOperation = 'source-over';
    }

    function getLinePoints(x0, y0, x1, y1) {
        const points = [];
        const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
        let err = dx + dy, e2;
        while (true) {
            points.push({ x: x0, y: y0 });
            if (x0 === x1 && y0 === y1) break;
            e2 = 2 * err;
            if (e2 >= dy) { err += dy; x0 += sx; }
            if (e2 <= dx) { err += dx; y0 += sy; }
        }
        return points;
    }

    function pickColor(x, y) {
        const activeFrame = state.frames[state.activeFrameIndex];
        if (!activeFrame) return;
        for (let i = 0; i < state.layers.length; i++) {
            const layer = state.layers[i];
            const layerCanvas = activeFrame.layers[layer.id];
            if (layer.visible && layerCanvas) {
                const c = layerCanvas.getContext('2d').getImageData(x, y, 1, 1).data;
                if (c[3] > 0) {
                    state.currentColor = rgbToHex(c[0], c[1], c[2]);
                    colorPicker.value = state.currentColor;
                    addToRecentColors(state.currentColor);
                    setActiveTool('pen');
                    return;
                }
            }
        }
    }

    function floodFill(startX, startY) {
        const layerCanvas = getActiveLayerCanvas();
        if (!layerCanvas) return;
        const layerCtx = layerCanvas.getContext('2d');
        const imageData = layerCtx.getImageData(0, 0, state.canvasWidth, state.canvasHeight);
        const data = imageData.data;
        const startIdx = (startY * state.canvasWidth + startX) * 4;
        const [startR, startG, startB, startA] = [data[startIdx], data[startIdx+1], data[startIdx+2], data[startIdx+3]];
        const newColorHex = state.currentColor;
        const newR = parseInt(newColorHex.slice(1,3), 16);
        const newG = parseInt(newColorHex.slice(3,5), 16);
        const newB = parseInt(newColorHex.slice(5,7), 16);

        if (startR === newR && startG === newG && startB === newB && startA === 255) return;
        if (startA === 0 && state.currentTool === 'eraser') return;

        const queue = [[startX, startY]];
        while (queue.length > 0) {
            const [x, y] = queue.shift();
            if (x < 0 || x >= state.canvasWidth || y < 0 || y >= state.canvasHeight) continue;
            const idx = (y * state.canvasWidth + x) * 4;
            if (data[idx] === startR && data[idx+1] === startG && data[idx+2] === startB && data[idx+3] === startA) {
                data[idx] = newR; data[idx+1] = newG; data[idx+2] = newB; data[idx+3] = 255;
                queue.push([x+1, y], [x-1, y], [x, y+1], [x, y-1]);
            }
        }
        layerCtx.putImageData(imageData, 0, 0);
    }

    function drawCombinedCanvas() {
        ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
        ctx.imageSmoothingEnabled = false;

        const activeFrame = state.frames[state.activeFrameIndex];
        if (!activeFrame) return;
        
        ctx.fillStyle = '#fff'; ctx.fillRect(0,0,mainCanvas.width, mainCanvas.height);
        ctx.fillStyle = '#ccc';
        for(let y=0; y<mainCanvas.height; y+=8) {
            for(let x=0; x<mainCanvas.width; x+=8) {
                if ((x/8 + y/8) % 2 == 0) ctx.fillRect(x, y, 8, 8);
            }
        }

        state.layers.slice().reverse().forEach(layer => {
            const layerCanvas = activeFrame.layers[layer.id];
            if (layer.visible && layerCanvas) {
                ctx.globalAlpha = layer.opacity;
                ctx.drawImage(layerCanvas, 0, 0);
            }
        });
        ctx.globalAlpha = 1.0;

        if (state.showGrid && state.zoom > 4) drawGrid();
        updatePreview();
    }

    function drawGrid() {
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1 / state.zoom;
        ctx.beginPath();
        for (let x = 1; x < state.canvasWidth; x++) { ctx.moveTo(x, 0); ctx.lineTo(x, state.canvasHeight); }
        for (let y = 1; y < state.canvasHeight; y++) { ctx.moveTo(0, y); ctx.lineTo(state.canvasWidth, y); }
        ctx.stroke();
    }

    function updatePreview() {
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        previewCtx.imageSmoothingEnabled = false;
        previewCtx.fillStyle = '#fff';
        previewCtx.fillRect(0,0,previewCanvas.width, previewCanvas.height);
        const activeFrame = state.frames[state.activeFrameIndex];
        if (!activeFrame) return;
        state.layers.slice().reverse().forEach(layer => {
            const layerCanvas = activeFrame.layers[layer.id];
            if (layer.visible && layerCanvas) {
                previewCtx.globalAlpha = layer.opacity;
                previewCtx.drawImage(layerCanvas, 0, 0, previewCanvas.width, previewCanvas.height);
            }
        });
        previewCtx.globalAlpha = 1.0;
    }

    function rgbToHex(r, g, b) { return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase(); }
    function addToRecentColors(color) { const c = color.toUpperCase(); if(!state.recentColors.includes(c)) { state.recentColors.unshift(c); if(state.recentColors.length > 8) state.recentColors.pop(); renderRecentColors(); }}
    function renderRecentColors() { recentColorsContainer.innerHTML = ''; state.recentColors.forEach(color => { const swatch = document.createElement('div'); swatch.className = 'color-swatch'; swatch.style.backgroundColor = color; swatch.addEventListener('click', () => { state.currentColor = color; colorPicker.value = color; }); recentColorsContainer.appendChild(swatch); }); }
    function createDefaultPalette() { const defaultColors = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF', '#C0C0C0', '#808080', '#800000', '#008000', '#000080', '#808000', '#008080', '#800080']; paletteContainer.innerHTML = ''; defaultColors.forEach(color => { const swatch = document.createElement('div'); swatch.className = 'color-swatch'; swatch.style.backgroundColor = color; swatch.addEventListener('click', () => { state.currentColor = color; colorPicker.value = color; addToRecentColors(color); }); paletteContainer.appendChild(swatch); }); }

    function addNewLayer() {
        if (state.layers.length >= 5) { alert('레이어는 최대 5개까지 추가할 수 있습니다.'); return; }
        const newLayer = { id: state.nextLayerId++, name: `레이어 ${state.nextLayerId}`, visible: true, opacity: 1.0 };
        state.layers.unshift(newLayer);
        state.activeLayerIndex = 0;
        state.frames.forEach(frame => { frame.layers[newLayer.id] = createBlankCanvas(); });
        renderLayerList();
    }
    function removeLayer() {
        if (state.layers.length <= 1) { alert('최소 한 개의 레이어는 있어야 합니다.'); return; }
        const layerIdToRemove = state.layers[state.activeLayerIndex].id;
        state.layers.splice(state.activeLayerIndex, 1);
        state.frames.forEach(frame => delete frame.layers[layerIdToRemove]);
        if (state.activeLayerIndex >= state.layers.length) state.activeLayerIndex = state.layers.length - 1;
        renderLayerList();
        drawCombinedCanvas();
    }
    function duplicateLayer() {
        if (state.layers.length >= 5) return;
        const sourceLayer = state.layers[state.activeLayerIndex];
        const newLayer = { ...sourceLayer, id: state.nextLayerId++, name: `${sourceLayer.name} 복사`};
        state.layers.splice(state.activeLayerIndex, 0, newLayer);
        state.frames.forEach(frame => {
            const newCanvas = createBlankCanvas();
            newCanvas.getContext('2d').drawImage(frame.layers[sourceLayer.id], 0, 0);
            frame.layers[newLayer.id] = newCanvas;
        });
        renderLayerList();
    }
    function moveLayer(direction) {
        const newIndex = state.activeLayerIndex + direction;
        if (newIndex < 0 || newIndex >= state.layers.length) return;
        const [layer] = state.layers.splice(state.activeLayerIndex, 1);
        state.layers.splice(newIndex, 0, layer);
        state.activeLayerIndex = newIndex;
        renderLayerList();
        drawCombinedCanvas();
    }
    function renderLayerList() {
        layerList.innerHTML = '';
        state.layers.forEach((layer, index) => {
            const li = document.createElement('li');
            li.textContent = layer.name;
            if (index === state.activeLayerIndex) li.classList.add('active');
            li.addEventListener('click', () => { state.activeLayerIndex = index; renderLayerList(); drawCombinedCanvas(); });
            layerList.appendChild(li);
        });
    }

    function addNewFrame() {
        if (state.frames.length >= 20) return;
        const newFrame = { layers: {} };
        const referenceFrame = state.frames[state.activeFrameIndex] || { layers: {} };
        state.layers.forEach(layer => {
            const sourceCanvas = referenceFrame.layers[layer.id];
            newFrame.layers[layer.id] = createBlankCanvas();
            if (sourceCanvas) {
                newFrame.layers[layer.id].getContext('2d').drawImage(sourceCanvas, 0, 0);
            }
        });
        state.frames.splice(state.activeFrameIndex + 1, 0, newFrame);
        state.activeFrameIndex++;
        renderFrameList();
        drawCombinedCanvas();
    }
    function copyFrame() {
        if (state.frames.length >= 20) return;
        const frameToCopy = state.frames[state.activeFrameIndex];
        const newFrame = { layers: {} };
        for (const layerId in frameToCopy.layers) {
            const sourceCanvas = frameToCopy.layers[layerId];
            newFrame.layers[layerId] = createBlankCanvas();
            newFrame.layers[layerId].getContext('2d').drawImage(sourceCanvas, 0, 0);
        }
        state.frames.splice(state.activeFrameIndex + 1, 0, newFrame);
        state.activeFrameIndex++;
        renderFrameList();
        drawCombinedCanvas();
    }
    function removeFrame() {
        if (state.frames.length <= 1) return;
        state.frames.splice(state.activeFrameIndex, 1);
        if (state.activeFrameIndex >= state.frames.length) state.activeFrameIndex = state.frames.length - 1;
        renderFrameList();
        drawCombinedCanvas();
    }
    function updateFrameThumbnail(thumbnail, frame) {
        const thumbCtx = thumbnail.getContext('2d');
        thumbCtx.clearRect(0, 0, thumbnail.width, thumbnail.height);
        thumbCtx.imageSmoothingEnabled = false;
        thumbCtx.fillStyle = '#fff';
        thumbCtx.fillRect(0,0,thumbnail.width, thumbnail.height);
        
        state.layers.slice().reverse().forEach(layer => {
            const layerCanvas = frame.layers[layer.id];
            if (layer.visible && layerCanvas) {
                thumbCtx.globalAlpha = layer.opacity;
                thumbCtx.drawImage(layerCanvas, 0, 0, thumbnail.width, thumbnail.height);
            }
        });
    }
    function renderFrameList() {
        frameList.innerHTML = '';
        state.frames.forEach((frame, index) => {
            const frameItem = document.createElement('div');
            frameItem.className = 'frame-item';
            if (index === state.activeFrameIndex) frameItem.classList.add('active');
            const thumbnail = document.createElement('canvas');
            thumbnail.className = 'frame-thumbnail';
            thumbnail.width = 48; thumbnail.height = 48;
            frameItem.appendChild(thumbnail);
            frameItem.addEventListener('click', () => {
                if (state.isPlaying) toggleAnimation();
                state.activeFrameIndex = index;
                renderFrameList();
                drawCombinedCanvas();
            });
            frameList.appendChild(frameItem);
            updateFrameThumbnail(thumbnail, frame);
        });
        frameList.querySelector('.active')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    let animationInterval;
    function toggleAnimation() {
        state.isPlaying = !state.isPlaying;
        playAnimationBtn.textContent = state.isPlaying ? '정지' : '재생';
        if (state.isPlaying) {
            let frameIdx = state.activeFrameIndex;
            animationInterval = setInterval(() => {
                frameIdx = (frameIdx + 1) % state.frames.length;
                state.activeFrameIndex = frameIdx;
                renderFrameList();
                drawCombinedCanvas();
            }, 1000 / fpsSlider.value);
        } else {
            clearInterval(animationInterval);
        }
    }

    function cloneStateForHistory(s) {
        const snapshot = {
            layers: JSON.parse(JSON.stringify(s.layers)),
            frames: s.frames.map(frame => {
                const newFrame = { layers: {} };
                for (const layerId in frame.layers) {
                    const canvas = createBlankCanvas();
                    canvas.getContext('2d').drawImage(frame.layers[layerId], 0, 0);
                    newFrame.layers[layerId] = canvas;
                }
                return newFrame;
            }),
            activeLayerIndex: s.activeLayerIndex,
            activeFrameIndex: s.activeFrameIndex,
            nextLayerId: s.nextLayerId,
        };
        return snapshot;
    }

    function saveHistory() {
        const snapshot = cloneStateForHistory(state);
        state.history.length = state.historyIndex + 1;
        state.history.push(snapshot);
        state.historyIndex++;
        undoBtn.disabled = state.historyIndex <= 0;
        redoBtn.disabled = true;
    }
    
    function applyHistoryState(snapshot) {
        state.layers = JSON.parse(JSON.stringify(snapshot.layers));
        state.frames = snapshot.frames.map(frame => {
            const newFrame = { layers: {} };
            for (const layerId in frame.layers) {
                const canvas = createBlankCanvas();
                canvas.getContext('2d').drawImage(frame.layers[layerId], 0, 0);
                newFrame.layers[layerId] = canvas;
            }
            return newFrame;
        });
        state.activeLayerIndex = snapshot.activeLayerIndex;
        state.activeFrameIndex = snapshot.activeFrameIndex;
        state.nextLayerId = snapshot.nextLayerId;
        
        renderLayerList();
        renderFrameList();
        drawCombinedCanvas();
    }
    
    function undo() {
        if (state.historyIndex <= 0) return;
        state.historyIndex--;
        applyHistoryState(state.history[state.historyIndex]);
        undoBtn.disabled = state.historyIndex <= 0;
        redoBtn.disabled = false;
    }
    
    function redo() {
        if (state.historyIndex >= state.history.length - 1) return;
        state.historyIndex++;
        applyHistoryState(state.history[state.historyIndex]);
        undoBtn.disabled = false;
        redoBtn.disabled = state.historyIndex >= state.history.length - 1;
    }

    function saveProject() {
        const dataToSave = {
            ...state,
            frames: state.frames.map(f => ({ layers: Object.fromEntries(Object.entries(f.layers).map(([id, c]) => [id, c.toDataURL()])) })),
            history: [],
        };
        const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'pixel-project.json';
        a.click();
        URL.revokeObjectURL(a.href);
    }
    
    async function loadProject(e) {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const projectData = JSON.parse(await file.text());
            const loadedFrames = await Promise.all(projectData.frames.map(async f => {
                const newLayers = {};
                await Promise.all(Object.entries(f.layers).map(async ([id, url]) => {
                    const canvas = createBlankCanvas();
                    const img = new Image();
                    await new Promise(res => { img.onload=res; img.src=url; });
                    canvas.getContext('2d').drawImage(img, 0, 0);
                    newLayers[id] = canvas;
                }));
                return { layers: newLayers };
            }));
            Object.assign(state, projectData, { frames: loadedFrames, history: [], historyIndex: -1 });
            
            mainCanvas.width = tempCanvas.width = state.canvasWidth;
            mainCanvas.height = tempCanvas.height = state.canvasHeight;
            canvasSizeSelector.value = state.canvasWidth;
            brushSizeInput.value = state.brushSize;
            
            centerCanvas();
            renderLayerList();
            renderFrameList();
            renderRecentColors();
            saveHistory();
        } catch (err) { alert('프로젝트 파일을 불러오는 데 실패했습니다.'); console.error(err); }
        e.target.value = '';
    }

    function exportPNG() {
        const a = document.createElement('a');
        a.href = previewCanvas.toDataURL('image/png');
        a.download = 'pixel-art.png';
        a.click();
    }
    
    // ★★★★★ 최종 수정된 GIF 내보내기 함수 ★★★★★
    function exportGIF() {
        exportGifBtn.disabled = true;
        exportGifBtn.textContent = 'GIF 생성 중...';

        // gif.worker.js의 전체 코드를 문자열로 여기에 포함시킵니다.
        const workerSource = `
        // gif.worker.js 0.2.0 - https://github.com/jnordberg/gif.js
        (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){var NeuQuant=require("./TypedNeuQuant.js");var LZWEncoder=require("./LZWEncoder.js");function ByteArray(){this.page=-1;this.pages=[];this.newPage()}ByteArray.pageSize=4096;ByteArray.charMap={};for(var i=0;i<256;i++)ByteArray.charMap[i]=String.fromCharCode(i);ByteArray.prototype.newPage=function(){this.pages[++this.page]=new Uint8Array(ByteArray.pageSize);this.cursor=0};ByteArray.prototype.getData=function(){var rv="";for(var p=0;p<this.pages.length;p++){for(var i=0;i<ByteArray.pageSize;i++){rv+=ByteArray.charMap[this.pages[p][i]]}}return rv};ByteArray.prototype.writeByte=function(val){if(this.cursor>=ByteArray.pageSize)this.newPage();this.pages[this.page][this.cursor++]=val};ByteArray.prototype.writeUTFBytes=function(string){for(var l=string.length,i=0;i<l;i++)this.writeByte(string.charCodeAt(i))};ByteArray.prototype.writeBytes=function(array,offset,length){for(var l=length||array.length,i=offset||0;i<l;i++)this.writeByte(array[i])};function GIFEncoder(width,height){this.width=~~width;this.height=~~height;this.transparent=null;this.transIndex=0;this.repeat=-1;this.delay=0;this.image=null;this.pixels=null;this.indexedPixels=null;this.colorDepth=null;this.colorTab=null;this.neuQuant=null;this.usedEntry=new Array;this.palSize=7;this.dispose=-1;this.firstFrame=true;this.sample=10;this.dither=false;this.globalPalette=false;this.out=new ByteArray}GIFEncoder.prototype.setDelay=function(milliseconds){this.delay=Math.round(milliseconds/10)};GIFEncoder.prototype.setFrameRate=function(fps){this.delay=Math.round(100/fps)};GIFEncoder.prototype.setDispose=function(disposalCode){if(disposalCode>=0)this.dispose=disposalCode};GIFEncoder.prototype.setRepeat=function(repeat){this.repeat=repeat};GIFEncoder.prototype.setTransparent=function(color){this.transparent=color};GIFEncoder.prototype.addFrame=function(imageData){this.image=imageData;this.colorTab=this.globalPalette&&this.globalPalette.slice?this.globalPalette:null;this.getImagePixels();this.analyzePixels();if(this.globalPalette===true)this.globalPalette=this.colorTab;if(this.firstFrame){this.writeLSD();this.writePalette();if(this.repeat>=0){this.writeNetscapeExt()}}this.writeGraphicCtrlExt();this.writeImageDesc();if(!this.firstFrame&&!this.globalPalette)this.writePalette();this.writePixels();this.firstFrame=false};GIFEncoder.prototype.finish=function(){this.out.writeByte(59)};GIFEncoder.prototype.setQuality=function(quality){if(quality<1)quality=1;this.sample=quality};GIFEncoder.prototype.setDither=function(dither){if(dither===true)dither="FloydSteinberg";this.dither=dither};GIFEncoder.prototype.setGlobalPalette=function(palette){this.globalPalette=palette};GIFEncoder.prototype.getGlobalPalette=function(){return this.globalPalette&&this.globalPalette.slice&&this.globalPalette.slice(0)||this.globalPalette};GIFEncoder.prototype.writeHeader=function(){this.out.writeUTFBytes("GIF89a")};GIFEncoder.prototype.analyzePixels=function(){if(!this.colorTab){this.neuQuant=new NeuQuant(this.pixels,this.sample);this.neuQuant.buildColormap();this.colorTab=this.neuQuant.getColormap()}if(this.dither){this.ditherPixels(this.dither.replace("-serpentine",""),this.dither.match(/-serpentine/)!==null)}else{this.indexPixels()}this.pixels=null;this.colorDepth=8;this.palSize=7;if(this.transparent!==null){this.transIndex=this.findClosest(this.transparent,true)}};GIFEncoder.prototype.indexPixels=function(imgq){var nPix=this.pixels.length/3;this.indexedPixels=new Uint8Array(nPix);var k=0;for(var j=0;j<nPix;j++){var index=this.findClosestRGB(this.pixels[k++]&255,this.pixels[k++]&255,this.pixels[k++]&255);this.usedEntry[index]=true;this.indexedPixels[j]=index}};GIFEncoder.prototype.ditherPixels=function(kernel,serpentine){var kernels={FalseFloydSteinberg:[[3/8,1,0],[3/8,0,1],[2/8,1,1]],FloydSteinberg:[[7/16,1,0],[3/16,-1,1],[5/16,0,1],[1/16,1,1]],Stucki:[[8/42,1,0],[4/42,2,0],[2/42,-2,1],[4/42,-1,1],[8/42,0,1],[4/42,1,1],[2/42,2,1],[1/42,-2,2],[2/42,-1,2],[4/42,0,2],[2/42,1,2],[1/42,2,2]],Atkinson:[[1/8,1,0],[1/8,2,0],[1/8,-1,1],[1/8,0,1],[1/8,1,1],[1/8,0,2]]};if(!kernel||!kernels[kernel]){throw"Unknown dithering kernel: "+kernel}var ds=kernels[kernel];var index=0,height=this.height,width=this.width,data=this.pixels;var direction=serpentine?-1:1;this.indexedPixels=new Uint8Array(this.pixels.length/3);for(var y=0;y<height;y++){if(serpentine)direction=direction*-1;for(var x=direction==1?0:width-1,xend=direction==1?width:0;x!==xend;x+=direction){index=y*width+x;var idx=index*3;var r1=data[idx];var g1=data[idx+1];var b1=data[idx+2];idx=this.findClosestRGB(r1,g1,b1);this.usedEntry[idx]=true;this.indexedPixels[index]=idx;idx*=3;var r2=this.colorTab[idx];var g2=this.colorTab[idx+1];var b2=this.colorTab[idx+2];var er=r1-r2;var eg=g1-g2;var eb=b1-b2;for(var i=direction==1?0:ds.length-1,end=direction==1?ds.length:0;i!==end;i+=direction){var x1=ds[i][1];var y1=ds[i][2];if(x1+x>=0&&x1+x<width&&y1+y>=0&&y1+y<height){var d=ds[i][0];idx=index+x1+y1*width;idx*=3;data[idx]=Math.max(0,Math.min(255,data[idx]+er*d));data[idx+1]=Math.max(0,Math.min(255,data[idx+1]+eg*d));data[idx+2]=Math.max(0,Math.min(255,data[idx+2]+eb*d))}}}}};GIFEncoder.prototype.findClosest=function(c,used){return this.findClosestRGB((c&16711680)>>16,(c&65280)>>8,c&255,used)};GIFEncoder.prototype.findClosestRGB=function(r,g,b,used){if(this.colorTab===null)return-1;if(this.neuQuant&&!used){return this.neuQuant.lookupRGB(r,g,b)}var c=b|g<<8|r<<16;var minpos=0;var dmin=256*256*256;var len=this.colorTab.length;for(var i=0,index=0;i<len;index++){var dr=r-(this.colorTab[i++]&255);var dg=g-(this.colorTab[i++]&255);var db=b-(this.colorTab[i++]&255);var d=dr*dr+dg*dg+db*db;if((!used||this.usedEntry[index])&&d<dmin){dmin=d;minpos=index}}return minpos};GIFEncoder.prototype.getImagePixels=function(){var w=this.width;var h=this.height;this.pixels=new Uint8Array(w*h*3);var data=this.image;var srcPos=0;var count=0;for(var i=0;i<h;i++){for(var j=0;j<w;j++){this.pixels[count++]=data[srcPos++];this.pixels[count++]=data[srcPos++];this.pixels[count++]=data[srcPos++];srcPos++}}};GIFEncoder.prototype.writeGraphicCtrlExt=function(){this.out.writeByte(33);this.out.writeByte(249);this.out.writeByte(4);var transp,disp;if(this.transparent===null){transp=0;disp=0}else{transp=1;disp=2}if(this.dispose>=0){disp=dispose&7}disp<<=2;this.out.writeByte(0|disp|0|transp);this.writeShort(this.delay);this.out.writeByte(this.transIndex);this.out.writeByte(0)};GIFEncoder.prototype.writeImageDesc=function(){this.out.writeByte(44);this.writeShort(0);this.writeShort(0);this.writeShort(this.width);this.writeShort(this.height);if(this.firstFrame||this.globalPalette){this.out.writeByte(0)}else{this.out.writeByte(128|0|0|0|this.palSize)}};GIFEncoder.prototype.writeLSD=function(){this.writeShort(this.width);this.writeShort(this.height);this.out.writeByte(128|112|0|this.palSize);this.out.writeByte(0);this.out.writeByte(0)};GIFEncoder.prototype.writeNetscapeExt=function(){this.out.writeByte(33);this.out.writeByte(255);this.out.writeByte(11);this.out.writeUTFBytes("NETSCAPE2.0");this.out.writeByte(3);this.out.writeByte(1);this.writeShort(this.repeat);this.out.writeByte(0)};GIFEncoder.prototype.writePalette=function(){this.out.writeBytes(this.colorTab);var n=3*256-this.colorTab.length;for(var i=0;i<n;i++)this.out.writeByte(0)};GIFEncoder.prototype.writeShort=function(pValue){this.out.writeByte(pValue&255);this.out.writeByte(pValue>>8&255)};GIFEncoder.prototype.writePixels=function(){var enc=new LZWEncoder(this.width,this.height,this.indexedPixels,this.colorDepth);enc.encode(this.out)};GIFEncoder.prototype.stream=function(){return this.out};module.exports=GIFEncoder},{"./LZWEncoder.js":2,"./TypedNeuQuant.js":3}],2:[function(require,module,exports){var EOF=-1;var BITS=12;var HSIZE=5003;var masks=[0,1,3,7,15,31,63,127,255,511,1023,2047,4095,8191,16383,32767,65535];function LZWEncoder(width,height,pixels,colorDepth){var initCodeSize=Math.max(2,colorDepth);var accum=new Uint8Array(256);var htab=new Int32Array(HSIZE);var codetab=new Int32Array(HSIZE);var cur_accum,cur_bits=0;var a_count;var free_ent=0;var maxcode;var clear_flg=false;var g_init_bits,ClearCode,EOFCode;function char_out(c,outs){accum[a_count++]=c;if(a_count>=254)flush_char(outs)}function cl_block(outs){cl_hash(HSIZE);free_ent=ClearCode+2;clear_flg=true;output(ClearCode,outs)}function cl_hash(hsize){for(var i=0;i<hsize;++i)htab[i]=-1}function compress(init_bits,outs){var fcode,c,i,ent,disp,hsize_reg,hshift;g_init_bits=init_bits;clear_flg=false;n_bits=g_init_bits;maxcode=MAXCODE(n_bits);ClearCode=1<<init_bits-1;EOFCode=ClearCode+1;free_ent=ClearCode+2;a_count=0;ent=nextPixel();hshift=0;for(fcode=HSIZE;fcode<65536;fcode*=2)++hshift;hshift=8-hshift;hsize_reg=HSIZE;cl_hash(hsize_reg);output(ClearCode,outs);outer_loop:while((c=nextPixel())!=EOF){fcode=(c<<BITS)+ent;i=c<<hshift^ent;if(htab[i]===fcode){ent=codetab[i];continue}else if(htab[i]>=0){disp=hsize_reg-i;if(i===0)disp=1;do{if((i-=disp)<0)i+=hsize_reg;if(htab[i]===fcode){ent=codetab[i];continue outer_loop}}while(htab[i]>=0)}output(ent,outs);ent=c;if(free_ent<1<<BITS){codetab[i]=free_ent++;htab[i]=fcode}else{cl_block(outs)}}output(ent,outs);output(EOFCode,outs)}function encode(outs){outs.writeByte(initCodeSize);remaining=width*height;curPixel=0;compress(initCodeSize+1,outs);outs.writeByte(0)}function flush_char(outs){if(a_count>0){outs.writeByte(a_count);outs.writeBytes(accum,0,a_count);a_count=0}}function MAXCODE(n_bits){return(1<<n_bits)-1}function nextPixel(){if(remaining===0)return EOF;--remaining;var pix=pixels[curPixel++];return pix&255}function output(code,outs){cur_accum&=masks[cur_bits];if(cur_bits>0)cur_accum|=code<<cur_bits;else cur_accum=code;cur_bits+=n_bits;while(cur_bits>=8){char_out(cur_accum&255,outs);cur_accum>>=8;cur_bits-=8}if(free_ent>maxcode||clear_flg){if(clear_flg){maxcode=MAXCODE(n_bits=g_init_bits);clear_flg=false}else{++n_bits;if(n_bits==BITS)maxcode=1<<BITS;else maxcode=MAXCODE(n_bits)}}if(code==EOFCode){while(cur_bits>0){char_out(cur_accum&255,outs);cur_accum>>=8;cur_bits-=8}flush_char(outs)}}this.encode=encode}module.exports=LZWEncoder},{}],3:[function(require,module,exports){var ncycles=100;var netsize=256;var maxnetpos=netsize-1;var netbiasshift=4;var intbiasshift=16;var intbias=1<<intbiasshift;var gammashift=10;var gamma=1<<gammashift;var betashift=10;var beta=intbias>>betashift;var betagamma=intbias<<gammashift-betashift;var initrad=netsize>>3;var radiusbiasshift=6;var radiusbias=1<<radiusbiasshift;var initradius=initrad*radiusbias;var radiusdec=30;var alphabiasshift=10;var initalpha=1<<alphabiasshift;var alphadec;var radbiasshift=8;var radbias=1<<radbiasshift;var alpharadbshift=alphabiasshift+radbiasshift;var alpharadbias=1<<alpharadbshift;var prime1=499;var prime2=491;var prime3=487;var prime4=503;var minpicturebytes=3*prime4;function NeuQuant(pixels,samplefac){var network;var netindex;var bias;var freq;var radpower;function init(){network=[];netindex=new Int32Array(256);bias=new Int32Array(netsize);freq=new Int32Array(netsize);radpower=new Int32Array(netsize>>3);var i,v;for(i=0;i<netsize;i++){v=(i<<netbiasshift+8)/netsize;network[i]=new Float64Array([v,v,v,0]);freq[i]=intbias/netsize;bias[i]=0}}function unbiasnet(){for(var i=0;i<netsize;i++){network[i][0]>>=netbiasshift;network[i][1]>>=netbiasshift;network[i][2]>>=netbiasshift;network[i][3]=i}}function altersingle(alpha,i,b,g,r){network[i][0]-=alpha*(network[i][0]-b)/initalpha;network[i][1]-=alpha*(network[i][1]-g)/initalpha;network[i][2]-=alpha*(network[i][2]-r)/initalpha}function alterneigh(radius,i,b,g,r){var lo=Math.abs(i-radius);var hi=Math.min(i+radius,netsize);var j=i+1;var k=i-1;var m=1;var p,a;while(j<hi||k>lo){a=radpower[m++];if(j<hi){p=network[j++];p[0]-=a*(p[0]-b)/alpharadbias;p[1]-=a*(p[1]-g)/alpharadbias;p[2]-=a*(p[2]-r)/alpharadbias}if(k>lo){p=network[k--];p[0]-=a*(p[0]-b)/alpharadbias;p[1]-=a*(p[1]-g)/alpharadbias;p[2]-=a*(p[2]-r)/alpharadbias}}}function contest(b,g,r){var bestd=~(1<<31);var bestbiasd=bestd;var bestpos=-1;var bestbiaspos=bestpos;var i,n,dist,biasdist,betafreq;for(i=0;i<netsize;i++){n=network[i];dist=Math.abs(n[0]-b)+Math.abs(n[1]-g)+Math.abs(n[2]-r);if(dist<bestd){bestd=dist;bestpos=i}biasdist=dist-(bias[i]>>intbiasshift-netbiasshift);if(biasdist<bestbiasd){bestbiasd=biasdist;bestbiaspos=i}betafreq=freq[i]>>betashift;freq[i]-=betafreq;bias[i]+=betafreq<<gammashift}freq[bestpos]+=beta;bias[bestpos]-=betagamma;return bestbiaspos}function inxbuild(){var i,j,p,q,smallpos,smallval,previouscol=0,startpos=0;for(i=0;i<netsize;i++){p=network[i];smallpos=i;smallval=p[1];for(j=i+1;j<netsize;j++){q=network[j];if(q[1]<smallval){smallpos=j;smallval=q[1]}}q=network[smallpos];if(i!=smallpos){j=q[0];q[0]=p[0];p[0]=j;j=q[1];q[1]=p[1];p[1]=j;j=q[2];q[2]=p[2];p[2]=j;j=q[3];q[3]=p[3];p[3]=j}if(smallval!=previouscol){netindex[previouscol]=startpos+i>>1;for(j=previouscol+1;j<smallval;j++)netindex[j]=i;previouscol=smallval;startpos=i}}netindex[previouscol]=startpos+maxnetpos>>1;for(j=previouscol+1;j<256;j++)netindex[j]=maxnetpos}function inxsearch(b,g,r){var a,p,dist;var bestd=1e3;var best=-1;var i=netindex[g];var j=i-1;while(i<netsize||j>=0){if(i<netsize){p=network[i];dist=p[1]-g;if(dist>=bestd)i=netsize;else{i++;if(dist<0)dist=-dist;a=p[0]-b;if(a<0)a=-a;dist+=a;if(dist<bestd){a=p[2]-r;if(a<0)a=-a;dist+=a;if(dist<bestd){bestd=dist;best=p[3]}}}}if(j>=0){p=network[j];dist=g-p[1];if(dist>=bestd)j=-1;else{j--;if(dist<0)dist=-dist;a=p[0]-b;if(a<0)a=-a;dist+=a;if(dist<bestd){a=p[2]-r;if(a<0)a=-a;dist+=a;if(dist<bestd){bestd=dist;best=p[3]}}}}}return best}function learn(){var i;var lengthcount=pixels.length;var alphadec=30+(samplefac-1)/3;var samplepixels=lengthcount/(3*samplefac);var delta=~~(samplepixels/ncycles);var alpha=initalpha;var radius=initradius;var rad=radius>>radiusbiasshift;if(rad<=1)rad=0;for(i=0;i<rad;i++)radpower[i]=alpha*((rad*rad-i*i)*radbias/(rad*rad));var step;if(lengthcount<minpicturebytes){samplefac=1;step=3}else if(lengthcount%prime1!==0){step=3*prime1}else if(lengthcount%prime2!==0){step=3*prime2}else if(lengthcount%prime3!==0){step=3*prime3}else{step=3*prime4}var b,g,r,j;var pix=0;i=0;while(i<samplepixels){b=(pixels[pix]&255)<<netbiasshift;g=(pixels[pix+1]&255)<<netbiasshift;r=(pixels[pix+2]&255)<<netbiasshift;j=contest(b,g,r);altersingle(alpha,j,b,g,r);if(rad!==0)alterneigh(rad,j,b,g,r);pix+=step;if(pix>=lengthcount)pix-=lengthcount;i++;if(delta===0)delta=1;if(i%delta===0){alpha-=alpha/alphadec;radius-=radius/radiusdec;rad=radius>>radiusbiasshift;if(rad<=1)rad=0;for(j=0;j<rad;j++)radpower[j]=alpha*((rad*rad-j*j)*radbias/(rad*rad))}}}function buildColormap(){init();learn();unbiasnet();inxbuild()}this.buildColormap=buildColormap;function getColormap(){var map=[];var index=[];for(var i=0;i<netsize;i++)index[network[i][3]]=i;var k=0;for(var l=0;l<netsize;l++){var j=index[l];map[k++]=network[j][0];map[k++]=network[j][1];map[k++]=network[j][2]}return map}this.getColormap=getColormap;this.lookupRGB=inxsearch}module.exports=NeuQuant},{}],4:[function(require,module,exports){var GIFEncoder,renderFrame;GIFEncoder=require("./GIFEncoder.js");renderFrame=function(frame){var encoder,page,stream,transfer;encoder=new GIFEncoder(frame.width,frame.height);if(frame.index===0){encoder.writeHeader()}else{encoder.firstFrame=false}encoder.setTransparent(frame.transparent);encoder.setRepeat(frame.repeat);encoder.setDelay(frame.delay);encoder.setQuality(frame.quality);encoder.setDither(frame.dither);encoder.setGlobalPalette(frame.globalPalette);encoder.addFrame(frame.data);if(frame.last){encoder.finish()}if(frame.globalPalette===true){frame.globalPalette=encoder.getGlobalPalette()}stream=encoder.stream();frame.data=stream.pages;frame.cursor=stream.cursor;frame.pageSize=stream.constructor.pageSize;if(frame.canTransfer){transfer=function(){var i,len,ref,results;ref=frame.data;results=[];for(i=0,len=ref.length;i<len;i++){page=ref[i];results.push(page.buffer)}return results}();return self.postMessage(frame,transfer)}else{return self.postMessage(frame)}};self.onmessage=function(event){return renderFrame(event.data)}},{"./GIFEncoder.js":1}]},{},[4]);
        //# sourceMappingURL=gif.worker.js.map
        `;

        let workerUrl = null;
        try {
            // 외부 파일 대신, 내장된 코드로 'Blob'을 만들고, 이를 가리키는 로컬 URL을 생성합니다.
            const blob = new Blob([workerSource], { type: 'application/javascript' });
            workerUrl = URL.createObjectURL(blob);

            const gif = new GIF({
                workers: 2,
                quality: 10,
                width: state.canvasWidth,
                height: state.canvasHeight,
                // 생성된 로컬 URL을 워커 스크립트로 지정합니다.
                workerScript: workerUrl
            });

            state.frames.forEach(frame => {
                const frameCanvas = createBlankCanvas();
                const frameCtx = frameCanvas.getContext('2d');
                
                frameCtx.fillStyle = '#FFFFFF';
                frameCtx.fillRect(0, 0, state.canvasWidth, state.canvasHeight);
                
                state.layers.slice().reverse().forEach(layer => {
                    if (layer.visible && frame.layers[layer.id]) {
                        frameCtx.globalAlpha = layer.opacity;
                        frameCtx.drawImage(frame.layers[layer.id], 0, 0);
                    }
                });
                
                gif.addFrame(frameCanvas, {
                    delay: 1000 / fpsSlider.value
                });
            });

            gif.on('finished', (blob) => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'pixel-animation.gif';
                a.click();
                URL.revokeObjectURL(a.href);

                exportGifBtn.disabled = false;
                exportGifBtn.textContent = 'GIF로 내보내기';
            });

            gif.render();

        } catch (error) {
            console.error('GIF 생성 중 오류 발생:', error);
            alert('GIF 생성에 실패했습니다. 브라우저 콘솔(F12)을 확인해주세요.');
            exportGifBtn.disabled = false;
            exportGifBtn.textContent = 'GIF로 내보내기';
        } finally {
            // GIF 생성이 끝나면(성공하든 실패하든) 생성했던 로컬 URL을 메모리에서 해제합니다.
            if (workerUrl) {
                URL.revokeObjectURL(workerUrl);
            }
        }
    }


    function makeDraggable(element) {
        let pos1=0,pos2=0,pos3=0,pos4=0;
        const header = element.querySelector('.panel-header');
        (header || element).onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            if (e.target.closest('.panel-content')) return;
            e.preventDefault();
            pos3 = e.clientX; pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY;
            pos3 = e.clientX; pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }
    
    init();
});