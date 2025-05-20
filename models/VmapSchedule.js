const mongoose = require("mongoose");

const VmapSchema = new mongoose.Schema({
  fileName: String,
  vmapXml: String,
  xmlLink: String,   // store the generated VMAP XML link here
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Vmap", VmapSchema);
