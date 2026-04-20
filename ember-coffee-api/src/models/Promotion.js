import mongoose from 'mongoose';

const { Schema } = mongoose;

const promotionSchema = new Schema({
  promoCode:       { type: String, required: true, unique: true, uppercase: true },
  discountPercent: { type: Number, required: true, min: 1, max: 100 },
  validUntil:      { type: Date,   required: true },
  promoBannerUrl:  { type: String, default: '' },
  showOnHome:      { type: Boolean, default: true },
  isActive:        { type: Boolean, default: true },
}, { timestamps: true });

const Promotion = mongoose.model('Promotion', promotionSchema);

export default Promotion;
