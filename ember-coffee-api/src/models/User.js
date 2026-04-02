import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    name:            { type: String, required: true },
    email:           { type: String, required: true, unique: true, lowercase: true },
    passwordHash:    { type: String, required: true },
    role:            { type: String, enum: ['customer', 'admin'], default: 'customer' },
    profileImageUrl: { type: String, default: '' },
    totalPoints:     { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export default model('User', userSchema);
