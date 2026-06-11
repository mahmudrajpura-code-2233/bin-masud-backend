import { Request, Response } from 'express';
import { prisma } from '../server';
import crypto from 'crypto';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    const userId = req.user?.userId; // Optional for guest checkout

    let isWholesaleVerified = false;
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && user.isWholesale) {
        isWholesaleVerified = true;
      }
    }

    // 1. Calculate Total Amount & Check Inventory
    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        return res.status(404).json({ error: `Product ${item.productId} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }

      // Apply wholesale discount if applicable
      const price = isWholesaleVerified ? product.price * 0.7 : product.price;
      totalAmount += price * item.quantity;

      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        price: price,
        size: item.size || '12ml'
      });
    }

    // 2. Create the Order in Database
    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount,
        paymentMethod,
        shippingAddress: JSON.stringify(shippingAddress),
        items: {
          create: orderItemsData
        }
      },
      include: { items: true }
    });

    if (paymentMethod === 'cod' || paymentMethod === 'COD') {
      for (const item of orderItemsData) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }
    }

    // 3. Razorpay Integration (Simulated/Ready for production)
    if (paymentMethod === 'RAZORPAY') {
      if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        const Razorpay = require('razorpay');
        const instance = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
          amount: Math.round(totalAmount * 100), // Amount is in currency subunits
          currency: "INR",
          receipt: order.id,
        };

        const razorpayOrder = await instance.orders.create(options);
        return res.status(201).json({ order, razorpayOrderId: razorpayOrder.id });
      } else {
        // Fallback for missing env vars
        console.warn('Razorpay keys missing, returning mock razorpay order id.');
        return res.status(201).json({ order, razorpayOrderId: `mock_rzp_${order.id}` });
      }
    }

    res.status(201).json({ order });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, user: { select: { name: true, email: true } } }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if the user is authorized to view this order
    // Allow if they are the owner, OR if they are an admin.
    // If order.userId is null (guest), maybe require email verification, but for now we skip complex guest logic.
    if (order.userId && order.userId !== req.user?.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    // In production, verify Razorpay signature here using crypto module
    const generated_signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string).update(orderId + "|" + paymentId).digest('hex');
    if (generated_signature !== signature) return res.status(400).json({ error: 'Invalid signature' });

    // Update order status
    const dbOrderId = req.body.dbOrderId; // ID from our DB
    const order = await prisma.order.update({
      where: { id: dbOrderId },
      data: { paymentStatus: 'SUCCESS', status: 'PROCESSING' }
    });

    // Deduct Inventory
    const orderDetails = await prisma.order.findUnique({ where: { id: dbOrderId }, include: { items: true } });
    if (orderDetails) {
      for (const item of orderDetails.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }
    }

    res.json({ message: 'Payment verified successfully', order });
  } catch (error) {
    res.status(500).json({ error: 'Payment verification failed' });
  }
};
