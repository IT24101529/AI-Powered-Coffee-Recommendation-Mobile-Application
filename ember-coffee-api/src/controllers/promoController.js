import Promotion from '../models/Promotion.js';

export const getPromotions = async (req, res, next) => {
  try {
    const promotions = await Promotion.find();
    res.status(200).json(promotions);
  } catch (err) {
    next(err);
  }
};

export const createPromotion = async (req, res, next) => {
  try {
    const { promoCode, discountPercent, validUntil } = req.body;
    if (!promoCode || discountPercent == null || !validUntil) {
      const err = new Error('promoCode, discountPercent, and validUntil are required');
      err.status = 400;
      return next(err);
    }
    const promotion = await Promotion.create({ promoCode, discountPercent, validUntil });
    res.status(201).json(promotion);
  } catch (err) {
    if (err.name === 'ValidationError') {
      err.status = 400;
    }
    next(err);
  }
};

export const updatePromotion = async (req, res, next) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      const err = new Error('Promotion not found');
      err.status = 404;
      return next(err);
    }
    const { promoCode, discountPercent, validUntil, promoBannerUrl } = req.body;
    if (promoCode !== undefined)      promotion.promoCode       = promoCode;
    if (discountPercent !== undefined) promotion.discountPercent = discountPercent;
    if (validUntil !== undefined)     promotion.validUntil      = validUntil;
    if (promoBannerUrl !== undefined) promotion.promoBannerUrl  = promoBannerUrl;
    const updated = await promotion.save();
    res.status(200).json(updated);
  } catch (err) {
    if (err.name === 'ValidationError') {
      err.status = 400;
    }
    next(err);
  }
};

export const deletePromotion = async (req, res, next) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      const err = new Error('Promotion not found');
      err.status = 404;
      return next(err);
    }
    await promotion.deleteOne();
    res.status(200).json({ message: 'Promotion deleted' });
  } catch (err) {
    next(err);
  }
};

export const validatePromoCode = async (req, res, next) => {
  try {
    const { promoCode } = req.params;
    const promotion = await Promotion.findOne({
      promoCode: { $regex: new RegExp(`^${promoCode}$`, 'i') },
    });
    if (!promotion || promotion.validUntil <= Date.now()) {
      const err = new Error('Promo code not found or expired');
      err.status = 404;
      return next(err);
    }
    res.status(200).json({ discountPercent: promotion.discountPercent });
  } catch (err) {
    next(err);
  }
};

export const uploadPromoBanner = async (req, res, next) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      const err = new Error('Promotion not found');
      err.status = 404;
      return next(err);
    }
    promotion.promoBannerUrl = req.file.path;
    const updated = await promotion.save();
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};
