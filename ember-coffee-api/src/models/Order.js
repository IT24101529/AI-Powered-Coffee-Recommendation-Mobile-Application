import { Schema, model } from 'mongoose';

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity:  { type: Number, required: true, min: 1 },
    price:     { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    userId:               { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items:                { type: [orderItemSchema], required: true },
    totalAmount:          { type: Number, required: true },
    orderStatus:          {
      type: String,
      enum: ['Pending', 'Brewing', 'Ready', 'Delivering', 'Delivered'],
      default: 'Pending',
    },
    /** Pickup: Pending → Brewing → Ready. Delivery: Pending → Brewing → Delivering → Delivered */
    fulfillmentMethod:    { type: String, enum: ['Pickup', 'Delivery'], default: 'Pickup' },
    paymentScreenshotUrl: { type: String, default: '' },
    promoCode:            { type: String, default: '' },
    /** Set when order reaches Ready (pickup) or Delivered (delivery); used for 12h active-list expiry */
    completedAt:          { type: Date, default: null },
  },
  { timestamps: true }
);

export default model('Order', orderSchema);
