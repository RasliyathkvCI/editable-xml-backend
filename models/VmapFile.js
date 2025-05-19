const mongoose = require('mongoose');

const VmapFileSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  vmapXml: { type: String, required: true }, // Store the XML content
}, { timestamps: true });

module.exports = mongoose.model('VmapFile', VmapFileSchema);