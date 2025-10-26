import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = express.Router();

// Upload image endpoint
router.post('/image', authenticateToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '請上傳圖片檔案'
      });
    }

    // Return the file URL
    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      data: {
        url: fileUrl,
        filename: req.file.filename
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: '上傳失敗'
    });
  }
});

export default router; 