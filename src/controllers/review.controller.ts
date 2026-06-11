import { Request, Response } from 'express';
import { prisma } from '../server';

export const getProductReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const productId = req.params.productId as string;
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

export const createReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId; // Populated by auth middleware
    const { productId, rating, comment } = req.body;

    // Check if user already reviewed this product
    const existing = await prisma.review.findFirst({
      where: { userId, productId }
    });

    if (existing) {
      res.status(400).json({ error: 'You have already reviewed this product.' });
      return;
    }

    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        comment
      },
      include: { user: { select: { name: true } } }
    });
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create review' });
  }
};
