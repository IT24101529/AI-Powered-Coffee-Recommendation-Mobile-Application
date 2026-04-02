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
    orderStatus:          { type: String, enum: ['Pending', 'Brewing', 'Ready'], default: 'Pending' },
    paymentScreenshotUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

export default model('Order', orderSchema);
