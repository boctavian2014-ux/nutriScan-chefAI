import express, { Router, Request, Response } from 'express';
import multer from 'multer';
import { createScan, getScan, getUserScans } from '../controllers/scansController';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept image files only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

/**
 * POST /v1/scans
 * Create a scan from an uploaded image
 * Body: FormData with userId and image file
 */
router.post('/', upload.single('image'), createScan);

/**
 * GET /v1/scans/:scanId
 * Get a specific scan
 */
router.get('/:scanId', getScan);

/**
 * GET /v1/scans/user/:userId
 * Get all scans for a user
 */
router.get('/user/:userId', getUserScans);

export default router;
