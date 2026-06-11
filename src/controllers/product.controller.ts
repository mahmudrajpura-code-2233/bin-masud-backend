import { Request, Response } from 'express';
import { prisma } from '../server';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { search, category, minPrice, maxPrice, page = 1, limit = 24 } = req.query;
    
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    const where: any = {};
    if (search) {
      where.name = { contains: search as string, mode: 'insensitive' };
    }
    if (category) {
      where.category = { name: category as string };
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limitNumber,
        include: { category: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    const formatProduct = (p: any) => ({
      ...p,
      images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
      sizes: typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes,
      topNotes: typeof p.topNotes === 'string' ? JSON.parse(p.topNotes) : p.topNotes,
      middleNotes: typeof p.middleNotes === 'string' ? JSON.parse(p.middleNotes) : p.middleNotes,
      baseNotes: typeof p.baseNotes === 'string' ? JSON.parse(p.baseNotes) : p.baseNotes,
    });

    res.json({
      products: products.map(formatProduct),
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error: any) {
    console.error('Prisma Error:', error);
    res.status(500).json({ error: 'Failed to fetch products', details: error.message });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, reviews: { include: { user: true } } }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const formatProduct = (p: any) => ({
      ...p,
      images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
      sizes: typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes,
      topNotes: typeof p.topNotes === 'string' ? JSON.parse(p.topNotes) : p.topNotes,
      middleNotes: typeof p.middleNotes === 'string' ? JSON.parse(p.middleNotes) : p.middleNotes,
      baseNotes: typeof p.baseNotes === 'string' ? JSON.parse(p.baseNotes) : p.baseNotes,
    });

    res.json(formatProduct(product));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    
    // Convert arrays to strings for SQLite
    const prismaData = {
      ...data,
      images: Array.isArray(data.images) ? JSON.stringify(data.images) : data.images,
      sizes: Array.isArray(data.sizes) ? JSON.stringify(data.sizes) : data.sizes,
      topNotes: Array.isArray(data.topNotes) ? JSON.stringify(data.topNotes) : data.topNotes,
      middleNotes: Array.isArray(data.middleNotes) ? JSON.stringify(data.middleNotes) : data.middleNotes,
      baseNotes: Array.isArray(data.baseNotes) ? JSON.stringify(data.baseNotes) : data.baseNotes,
    };

    const product = await prisma.product.create({ data: prismaData });
    
    const formatProduct = (p: any) => ({
      ...p,
      images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
      sizes: typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes,
      topNotes: typeof p.topNotes === 'string' ? JSON.parse(p.topNotes) : p.topNotes,
      middleNotes: typeof p.middleNotes === 'string' ? JSON.parse(p.middleNotes) : p.middleNotes,
      baseNotes: typeof p.baseNotes === 'string' ? JSON.parse(p.baseNotes) : p.baseNotes,
    });

    res.status(201).json(formatProduct(product));
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = req.body;
    
    const prismaData = {
      ...data,
    };
    
    if (data.images !== undefined) prismaData.images = Array.isArray(data.images) ? JSON.stringify(data.images) : data.images;
    if (data.sizes !== undefined) prismaData.sizes = Array.isArray(data.sizes) ? JSON.stringify(data.sizes) : data.sizes;
    if (data.topNotes !== undefined) prismaData.topNotes = Array.isArray(data.topNotes) ? JSON.stringify(data.topNotes) : data.topNotes;
    if (data.middleNotes !== undefined) prismaData.middleNotes = Array.isArray(data.middleNotes) ? JSON.stringify(data.middleNotes) : data.middleNotes;
    if (data.baseNotes !== undefined) prismaData.baseNotes = Array.isArray(data.baseNotes) ? JSON.stringify(data.baseNotes) : data.baseNotes;

    const product = await prisma.product.update({ where: { id }, data: prismaData });
    
    const formatProduct = (p: any) => ({
      ...p,
      images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
      sizes: typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes,
      topNotes: typeof p.topNotes === 'string' ? JSON.parse(p.topNotes) : p.topNotes,
      middleNotes: typeof p.middleNotes === 'string' ? JSON.parse(p.middleNotes) : p.middleNotes,
      baseNotes: typeof p.baseNotes === 'string' ? JSON.parse(p.baseNotes) : p.baseNotes,
    });

    res.json(formatProduct(product));
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};
