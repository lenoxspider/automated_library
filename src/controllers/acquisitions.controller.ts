import { Request, Response } from 'express';
import { container } from 'tsyringe';
import asyncHandler from 'express-async-handler';
import { AcquisitionService, AcquisitionError } from '../services/acquisition.service';

const acquisitionService = container.resolve(AcquisitionService);

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await acquisitionService.getOrders();
  res.json(orders);
});

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { title, vendor, quantity, total_price } = req.body;

  if (!title || !vendor || !quantity || !total_price) {
    res.status(400).json({ error: 'Title, vendor, quantity, and total_price are required' });
    return;
  }

  const order = await acquisitionService.createOrder({
    title,
    vendor,
    quantity: Number(quantity),
    total_price: Number(total_price)
  });

  res.status(201).json(order);
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const { status } = req.body;

  const order = await acquisitionService.updateOrderStatus(id, status);
  res.json({ message: 'Order status updated', order });
});

export const receiveOrder = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const { author, genre, isbn, branch, section, shelf, coverUrl } = req.body;

  if (!author || !genre || !isbn) {
    res
      .status(400)
      .json({ error: 'Author, genre, and ISBN are required to receive an order into inventory' });
    return;
  }

  try {
    await acquisitionService.receiveOrder(id, {
      author,
      genre,
      isbn,
      branch,
      section,
      shelf,
      coverUrl
    });
    res.json({ message: 'Order received and added to inventory' });
  } catch (err) {
    if (err instanceof AcquisitionError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});
