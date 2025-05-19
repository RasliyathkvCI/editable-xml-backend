const mongoose = require('mongoose');

const VastLinkSchema = new mongoose.Schema({
  vastId: { type: mongoose.Schema.Types.ObjectId, ref: 'VastAd', required: true },
  link: { type: String, required: true }
});

module.exports = mongoose.model('VastLink', VastLinkSchema);