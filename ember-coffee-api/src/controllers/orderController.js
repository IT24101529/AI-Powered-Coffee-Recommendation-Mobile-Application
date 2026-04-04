import Order from '../models/Order.js';
import User from '../models/User.js';

const STATUS_SEQUENCE = ['Pending', 'Brewing', 'Ready'];

export const createOrder = async (req, res, next) => {
  try {
    const { items, totalAmount, promoCode } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'items array must not be empty' });
    }
    const order = await Order.create({
      userId: req.user.id,
      items,
      totalAmount,
      orderStatus: 'Pending',
      promoCode: promoCode || '',
    });
    res.status(201).json(order);
  } catch (err) {
    if (err.name === 'ValidationError') err.status = 400;
    next(err);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user.id });
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      const err = new Error('Order not found');
      err.status = 404;
      return next(err);
    }

    const currentIndex = STATUS_SEQUENCE.indexOf(order.orderStatus);
    const nextStatus = STATUS_SEQUENCE[currentIndex + 1];

    if (!nextStatus || req.body.orderStatus !== nextStatus) {
      return res.status(400).json({
        message: `Invalid status transition. Current status is '${order.orderStatus}'. Next valid status is '${nextStatus || 'none (already at final status)'}'.`,
      });
    }

    order.orderStatus = nextStatus;
    await order.save();

    // Award points when order is Ready (1% of totalAmount, rounded down)
    if (nextStatus === 'Ready') {
      const pointsEarned = Math.floor(order.totalAmount * 0.01);
      if (pointsEarned > 0) {
        await User.findByIdAndUpdate(order.userId, { $inc: { totalPoints: pointsEarned } });
      }
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
};

export const uploadPaymentScreenshot = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentScreenshotUrl: req.file.path },
      { new: true }
    );
    if (!order) {
      const err = new Error('Order not found');
      err.status = 404;
      return next(err);
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
};
