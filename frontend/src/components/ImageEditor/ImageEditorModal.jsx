import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert
} from '@mui/material';
import ImageEditor from './ImageEditor';

const ImageEditorModal = ({ 
  open, 
  onClose, 
  imageUrl, 
  onSave,
  title = "Editor de Imagem" 
}) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async (blob, dataURL) => {
    try {
      setSaving(true);
      setError(null);
      
      await onSave(blob, dataURL);
      onClose();
      
    } catch (err) {
      console.error('Erro ao salvar imagem:', err);
      setError('Erro ao salvar a imagem. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!saving) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Typography variant="h6">{title}</Typography>
      </DialogTitle>
      
      <DialogContent sx={{ p: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {imageUrl ? (
          <ImageEditor
            imageUrl={imageUrl}
            onSave={handleSave}
            onCancel={handleCancel}
            maxWidth={800}
            maxHeight={500}
          />
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              Nenhuma imagem selecionada
            </Typography>
          </Box>
        )}
      </DialogContent>

      {saving && (
        <DialogActions>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, pb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Salvando imagem...
            </Typography>
          </Box>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ImageEditorModal;
