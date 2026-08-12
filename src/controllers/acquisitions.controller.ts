import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../config/prisma';

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await prisma.purchase_orders.findMany({
    orderBy: { id: 'desc' }
  });
  res.json(orders);
});

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { title, vendor, quantity, total_price } = req.body;

  const order = await prisma.purchase_orders.create({
    data: {
      title,
      vendor,
      quantity: Number(quantity),
      total_price: Number(total_price),
      order_date: new Date().toISOString()
    }
  });

  res.status(201).json({ message: 'Purchase order created', order });
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const { status } = req.body;

  const order = await prisma.purchase_orders.update({
    where: { id },
    data: { status }
  });

  res.json({ message: 'Order status updated', order });
});
