const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema({
  type: String,
  adUrl: String,
  duration: { type: String, default: '00:00:05' },
  adId: String,
  timeOffset: String,
  vastXml: String,
  xmlLink: String,  // store the generated link here
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

module.exports = mongoose.model('AdSchedule', AdSchema);
