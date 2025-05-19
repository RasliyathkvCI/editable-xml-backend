const mongoose = require('mongoose');

const VastAdSchema = new mongoose.Schema({
  type: { type: String, required: true },
  adUrl: { type: String, required: true },
  duration: { type: String, default: '00:00:05' },
  adId: { type: String, required: true },
  fileUrl: { type: String },
  vastXml: { type: String }, 
 timeOffset: { type: String }, 
}, { timestamps: true });

module.exports = mongoose.model('VastAd', VastAdSchema);
