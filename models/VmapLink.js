const mongoose = require('mongoose');

const VmapLinkSchema = new mongoose.Schema({
  vmapId: { type: mongoose.Schema.Types.ObjectId, ref: 'VmapFile', required: true },
  link: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('VmapLink', VmapLinkSchema);