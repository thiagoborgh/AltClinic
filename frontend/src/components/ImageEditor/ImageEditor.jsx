import React, { useRef, useEffect, useState } from 'react';
import { fabric } from 'fabric';
import {
  Box,
  Button,
  ButtonGroup,
  Slider,
  Typography,
  TextField,
  IconButton,
  Paper,
  Divider,
  Alert
} from '@mui/material';
import {
  Brush as BrushIcon,
  Edit as TextIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RestartAlt as ResetIcon
} from '@mui/icons-material';

const ImageEditor = ({ 
  imageUrl, 
  onSave, 
  onCancel,
  maxWidth = 800,
  maxHeight = 600 
}) => {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [tool, setTool] = useState('select'); // select, brush, text
  const [brushWidth, setBrushWidth] = useState(5);
  const [brushColor, setBrushColor] = useState('#ff0000');
  const [textColor, setTextColor] = useState('#000000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    initializeCanvas();
    return () => {
      if (canvas) {
        canvas.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (canvas && imageUrl) {
      loadImage();
    }
  }, [canvas, imageUrl]);

  const initializeCanvas = () => {
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: maxWidth,
      height: maxHeight,
      backgroundColor: '#ffffff',
      selection: true
    });

    // Configurar eventos
    fabricCanvas.on('path:created', saveState);
    fabricCanvas.on('object:added', saveState);
    fabricCanvas.on('object:removed', saveState);
    fabricCanvas.on('object:modified', saveState);

    setCanvas(fabricCanvas);
  };

  const loadImage = () => {
    fabric.Image.fromURL(imageUrl, (img) => {
      // Calcular escala para fit na canvas
      const scaleX = maxWidth / img.width;
      const scaleY = maxHeight / img.height;
      const scale = Math.min(scaleX, scaleY, 1);

      img.set({
        scaleX: scale,
        scaleY: scale,
        left: (maxWidth - img.width * scale) / 2,
        top: (maxHeight - img.height * scale) / 2,
        selectable: false,
        evented: false
      });

      canvas.clear();
      canvas.add(img);
      canvas.sendToBack(img);
      canvas.renderAll();
      
      saveState();
    }, {
      crossOrigin: 'anonymous'
    });
  };

  const saveState = () => {
    const currentState = canvas.toJSON(['selectable', 'evented']);
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(currentState);
    
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep > 0) {
      const previousState = history[historyStep - 1];
      canvas.loadFromJSON(previousState, () => {
        canvas.renderAll();
        setHistoryStep(historyStep - 1);
      });
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const nextState = history[historyStep + 1];
      canvas.loadFromJSON(nextState, () => {
        canvas.renderAll();
        setHistoryStep(historyStep + 1);
      });
    }
  };

  const enableDrawing = () => {
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush.width = brushWidth;
    canvas.freeDrawingBrush.color = brushColor;
    setTool('brush');
  };

  const disableDrawing = () => {
    canvas.isDrawingMode = false;
    setTool('select');
  };

  const addText = () => {
    const text = new fabric.IText('Clique para editar', {
      left: canvas.width / 2,
      top: canvas.height / 2,
      fontFamily: 'Arial',
      fontSize: 20,
      fill: textColor,
      textAlign: 'center',
      originX: 'center',
      originY: 'center'
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    text.enterEditing();
    canvas.renderAll();
  };

  const deleteSelected = () => {
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach(obj => {
        canvas.remove(obj);
      });
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  };

  const zoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 3);
    setZoom(newZoom);
    canvas.setZoom(newZoom);
    canvas.renderAll();
  };

  const zoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 0.5);
    setZoom(newZoom);
    canvas.setZoom(newZoom);
    canvas.renderAll();
  };

  const resetZoom = () => {
    setZoom(1);
    canvas.setZoom(1);
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.renderAll();
  };

  const clearCanvas = () => {
    if (window.confirm('Tem certeza que deseja limpar todas as anotações?')) {
      // Manter apenas a imagem de fundo
      const objects = canvas.getObjects();
      const imageObject = objects[0]; // Primeira object é a imagem
      
      canvas.clear();
      if (imageObject && imageObject.type === 'image') {
        canvas.add(imageObject);
        canvas.sendToBack(imageObject);
      }
      canvas.renderAll();
      saveState();
    }
  };

  const handleSave = () => {
    // Temporariamente remover seleção para export limpo
    canvas.discardActiveObject();
    canvas.renderAll();

    // Gerar imagem
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 0.9,
      multiplier: 1
    });

    // Converter para blob
    canvas.toCanvasElement(1).toBlob((blob) => {
      onSave(blob, dataURL);
    }, 'image/png', 0.9);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Toolbar */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {/* Ferramentas */}
          <ButtonGroup variant="outlined" size="small">
            <Button
              variant={tool === 'select' ? 'contained' : 'outlined'}
              onClick={disableDrawing}
            >
              Selecionar
            </Button>
            <Button
              variant={tool === 'brush' ? 'contained' : 'outlined'}
              onClick={enableDrawing}
              startIcon={<BrushIcon />}
            >
              Desenhar
            </Button>
            <Button
              onClick={addText}
              startIcon={<TextIcon />}
            >
              Texto
            </Button>
          </ButtonGroup>

          <Divider orientation="vertical" flexItem />

          {/* Ações */}
          <ButtonGroup size="small">
            <IconButton
              onClick={undo}
              disabled={historyStep <= 0}
              title="Desfazer"
            >
              <UndoIcon />
            </IconButton>
            <IconButton
              onClick={redo}
              disabled={historyStep >= history.length - 1}
              title="Refazer"
            >
              <RedoIcon />
            </IconButton>
            <IconButton
              onClick={deleteSelected}
              title="Deletar selecionado"
            >
              <DeleteIcon />
            </IconButton>
          </ButtonGroup>

          <Divider orientation="vertical" flexItem />

          {/* Zoom */}
          <ButtonGroup size="small">
            <IconButton onClick={zoomOut} title="Diminuir zoom">
              <ZoomOutIcon />
            </IconButton>
            <Button variant="outlined" size="small">
              {Math.round(zoom * 100)}%
            </Button>
            <IconButton onClick={zoomIn} title="Aumentar zoom">
              <ZoomInIcon />
            </IconButton>
            <IconButton onClick={resetZoom} title="Reset zoom">
              <ResetIcon />
            </IconButton>
          </ButtonGroup>
        </Box>

        {/* Configurações do pincel */}
        {tool === 'brush' && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">Pincel:</Typography>
            <Box sx={{ width: 100 }}>
              <Typography variant="caption">Tamanho</Typography>
              <Slider
                value={brushWidth}
                onChange={(e, value) => {
                  setBrushWidth(value);
                  if (canvas.freeDrawingBrush) {
                    canvas.freeDrawingBrush.width = value;
                  }
                }}
                min={1}
                max={50}
                size="small"
              />
            </Box>
            <TextField
              type="color"
              value={brushColor}
              onChange={(e) => {
                setBrushColor(e.target.value);
                if (canvas.freeDrawingBrush) {
                  canvas.freeDrawingBrush.color = e.target.value;
                }
              }}
              size="small"
              sx={{ width: 60 }}
            />
          </Box>
        )}

        {/* Configurações do texto */}
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2">Texto:</Typography>
          <TextField
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            size="small"
            label="Cor"
            sx={{ width: 80 }}
          />
        </Box>
      </Paper>

      {/* Canvas */}
      <Paper sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
        <canvas
          ref={canvasRef}
          style={{
            border: '1px solid #ddd',
            cursor: tool === 'brush' ? 'crosshair' : 'default'
          }}
        />
      </Paper>

      {/* Ações */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="outlined"
          color="error"
          onClick={clearCanvas}
        >
          Limpar Anotações
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            startIcon={<SaveIcon />}
          >
            Salvar
          </Button>
        </Box>
      </Box>

      {/* Instruções */}
      <Alert severity="info" sx={{ mt: 1 }}>
        <Typography variant="body2">
          <strong>Instruções:</strong><br />
          • Use a ferramenta de desenho para fazer anotações<br />
          • Clique em "Texto" para adicionar legendas<br />
          • Use Ctrl+Z / Ctrl+Y para desfazer/refazer<br />
          • As anotações não são destrutivas - a imagem original é preservada
        </Typography>
      </Alert>
    </Box>
  );
};

export default ImageEditor;
