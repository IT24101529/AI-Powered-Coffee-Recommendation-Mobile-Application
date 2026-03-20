const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  description:   { type: String, required: true },
  price:         { type: Number, required: true },
  category:      { type: String, enum: ['Hot','Cold','Specialty','Non-Coffee'], required: true },
  caffeine:      { type: String, enum: ['None','Low','Medium','High'], default: 'Medium' },
  image:         { type: String },
  available:     { type: Boolean, default: true },
  featureVector: { type: Object },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);