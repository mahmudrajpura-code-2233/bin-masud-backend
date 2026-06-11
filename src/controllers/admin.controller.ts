import { Request, Response } from 'express';
import { prisma } from '../server';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalProducts = await prisma.product.count();
    const totalOrders = await prisma.order.count();
    
    const orders = await prisma.order.findMany({
      where: { paymentStatus: 'SUCCESS' },
      select: { totalAmount: true }
    });
    
    const totalRevenue = orders.reduce((sum: number, order: any) => sum + order.totalAmount, 0);

    const pendingOrders = await prisma.order.count({ where: { status: 'PENDING' } });

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingOrders
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: { user: true, items: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    
    const order = await prisma.order.update({
      where: { id },
      data: { status: status as string }
    });
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isWholesale: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const approveWholesaleUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { isWholesale } = req.body;
    
    const user = await prisma.user.update({
      where: { id },
      data: { isWholesale },
      select: { id: true, name: true, email: true, isWholesale: true }
    });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update wholesale status' });
  }
};
