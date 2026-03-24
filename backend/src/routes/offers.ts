import { Router, Request, Response } from 'express';
import Offer from '../models/Offer';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

// Set up multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// GET /api/offers - Get all active offers
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const offers = await Offer.find({ isActive: true }).populate('products');
        res.json({ offers });
    } catch (error) {
        console.error('Get offers error:', error);
        res.status(500).json({ error: 'Failed to fetch offers' });
    }
});

// POST /api/offers/seed - Seed offers from a JSON file
router.post('/seed', [authenticateToken, requireAdmin, upload.single('file')], async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded.' });
            return;
        }

        const offersData = JSON.parse(req.file.buffer.toString('utf-8'));

        await Offer.deleteMany({});
        await Offer.insertMany(offersData);

        res.status(201).json({ message: 'Offers seeded successfully' });
    } catch (error) {
        console.error('Seed offers error:', error);
        res.status(500).json({ error: 'Failed to seed offers' });
    }
});

// POST /api/offers - Create a new offer
router.post('/', [authenticateToken, requireAdmin], async (req: Request, res: Response): Promise<void> => {
    try {
        const newOffer = new Offer(req.body);
        await newOffer.save();
        res.status(201).json(newOffer);
    } catch (error) {
        console.error('Create offer error:', error);
        res.status(500).json({ error: 'Failed to create offer' });
    }
});

// PUT /api/offers/:id - Update an offer
router.put('/:id', [authenticateToken, requireAdmin], async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updatedOffer = await Offer.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedOffer) {
            res.status(404).json({ error: 'Offer not found' });
            return;
        }
        res.json(updatedOffer);
    } catch (error) {
        console.error('Update offer error:', error);
        res.status(500).json({ error: 'Failed to update offer' });
    }
});

// DELETE /api/offers/:id - Delete an offer
router.delete('/:id', [authenticateToken, requireAdmin], async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const deletedOffer = await Offer.findByIdAndDelete(id);
        if (!deletedOffer) {
            res.status(404).json({ error: 'Offer not found' });
            return;
        }
        res.json({ message: 'Offer deleted successfully' });
    } catch (error) {
        console.error('Delete offer error:', error);
        res.status(500).json({ error: 'Failed to delete offer' });
    }
});

export default router;
