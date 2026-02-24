import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import fs from 'fs';
import path from 'path';

/**
 * POST /v1/scans
 * Create a new scan from an uploaded image
 * Expects FormData with: userId, image (file)
 */
export const createScan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.body;
    const imageFile = (req as any).file;

    // Validate inputs
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_USER_ID',
        message: 'userId is required',
        requestId: req.requestId,
      });
    }

    if (!imageFile) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_IMAGE',
        message: 'Image file is required',
        requestId: req.requestId,
      });
    }

    // Generate scan ID
    const scanId = uuidv4();
    const timestamp = new Date().toISOString();

    // Save image to uploads directory
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const imageFileName = `${scanId}-${imageFile.originalname}`;
    const imagePath = path.join(uploadsDir, imageFileName);
    fs.writeFileSync(imagePath, imageFile.buffer);

    // For now, we'll use a placeholder for OCR extraction
    // In production, you would use Tesseract.js or Google Cloud Vision API
    const rawOcrText = `[Image received: ${imageFileName}]`;
    
    // Extract ingredients (placeholder - in production use NLP or API)
    // Sample ingredients if not detected
    const extractedIngredients = JSON.stringify([
      'water',
      'sugar',
      'natural flavors',
      'citric acid',
      'sodium benzoate'
    ]);

    // Store scan in database
    try {
      const result = await query(
        `INSERT INTO scans 
         (id, user_id, image_path, raw_ocr_text, extracted_ingredients, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [scanId, userId, imageFileName, rawOcrText, extractedIngredients, timestamp]
      );

      const scan = result.rows[0];

      // Return scan response in correct format
      const responseData = {
        id: scan.id,
        userId: scan.user_id,
        imageUrl: `/uploads/${imageFileName}`,
        rawOcrText: scan.raw_ocr_text,
        extractedIngredients: JSON.parse(scan.extracted_ingredients || '[]'),
        createdAt: scan.created_at
      };
      
      console.log('[API] Scan created successfully:', { scanId, userId });
      console.log('[API] Returning response:', responseData);
      
      return res.status(201).json({
        data: responseData
      });
    } catch (dbError: any) {
      // If table doesn't exist, return mock response (for development)
      if (dbError.code === '42P01') {
        console.warn('⚠️  Scans table does not exist - returning mock response');
        
        const mockIngredients = [
          'water',
          'sugar',
          'natural flavors',
          'citric acid',
          'sodium benzoate'
        ];
        
        const responseData = {
          id: scanId,
          userId: userId,
          imageUrl: `/uploads/${imageFileName}`,
          rawOcrText: rawOcrText,
          extractedIngredients: mockIngredients,
          createdAt: timestamp
        };
        
        console.log('[API] Mock response created:', responseData);
        
        return res.status(201).json({
          data: responseData
        });
      }
      throw dbError;
    }

  } catch (error) {
    console.error('[ScansController] Error creating scan:', error);
    next(error);
  }
};

/**
 * GET /v1/scans/:scanId
 * Get a specific scan by ID
 */
export const getScan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scanId } = req.params;

    if (!scanId) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_SCAN_ID',
        message: 'scanId is required',
        requestId: req.requestId,
      });
    }

    try {
      const result = await query(
        'SELECT * FROM scans WHERE id = $1',
        [scanId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'SCAN_NOT_FOUND',
          message: 'Scan not found',
          requestId: req.requestId,
        });
      }

      const scan = result.rows[0];
      return res.status(200).json({
        success: true,
        data: {
          id: scan.id,
          userId: scan.user_id,
          imageUrl: `/uploads/${scan.image_path}`,
          rawOcrText: scan.raw_ocr_text,
          extractedIngredients: JSON.parse(scan.extracted_ingredients || '[]'),
          createdAt: scan.created_at
        },
        requestId: req.requestId,
      });
    } catch (dbError: any) {
      if (dbError.code === '42P01') {
        // Mock response if table doesn't exist
        return res.status(404).json({
          success: false,
          error: 'SCAN_NOT_FOUND',
          message: 'Scan not found (database not initialized)',
          requestId: req.requestId,
        });
      }
      throw dbError;
    }

  } catch (error) {
    console.error('[ScansController] Error getting scan:', error);
    next(error);
  }
};

/**
 * GET /v1/scans/user/:userId
 * Get all scans for a user
 */
export const getUserScans = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_USER_ID',
        message: 'userId is required',
        requestId: req.requestId,
      });
    }

    try {
      const result = await query(
        'SELECT * FROM scans WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [userId, limit, offset]
      );

      const scans = result.rows.map(scan => ({
        id: scan.id,
        userId: scan.user_id,
        imageUrl: `/uploads/${scan.image_path}`,
        rawOcrText: scan.raw_ocr_text,
        extractedIngredients: JSON.parse(scan.extracted_ingredients || '[]'),
        createdAt: scan.created_at
      }));

      return res.status(200).json({
        success: true,
        data: scans,
        pagination: {
          limit,
          offset,
          total: result.rowCount
        },
        requestId: req.requestId,
      });
    } catch (dbError: any) {
      if (dbError.code === '42P01') {
        // Return empty list if table doesn't exist
        return res.status(200).json({
          success: true,
          data: [],
          pagination: { limit, offset, total: 0 },
          requestId: req.requestId,
        });
      }
      throw dbError;
    }

  } catch (error) {
    console.error('[ScansController] Error getting user scans:', error);
    next(error);
  }
};
