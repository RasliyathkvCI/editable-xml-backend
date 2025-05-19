const express = require("express");
const router = express.Router();
const VmapFile = require("../models/VmapFile");
const VmapLink = require("../models/VmapLink");

router.post("/create", async (req, res) => {
  try {
    const { vastFiles } = req.body;
    if (!vastFiles || !Array.isArray(vastFiles) || vastFiles.length === 0) {
      return res.status(400).json({ message: "vastFiles array is required" });
    }

    // Build VMAP XML string
    let vmapXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    vmapXml += `<vmap:VMAP xmlns:vmap="http://www.iab.net/videosuite/vmap" version="1.0">\n`;

    vastFiles.forEach((ad) => {
      const { type, timeOffset, xmlLink, adId } = ad;
      vmapXml += `  <vmap:AdBreak timeOffset="${timeOffset}" breakType="linear" breakId="${type}">\n`;
      vmapXml += `    <vmap:AdSource id="${adId}" allowMultipleAds="false" followRedirects="true">\n`;
      vmapXml += `      <vmap:AdTagURI templateType="vast3"><![CDATA[ ${xmlLink} ]]></vmap:AdTagURI>\n`;
      vmapXml += `    </vmap:AdSource>\n`;
      vmapXml += `  </vmap:AdBreak>\n`;
    });

    vmapXml += `</vmap:VMAP>`;

    // Use timestamp for unique filename
    const fileName = `vmap-${Date.now()}.xml`;

    // Save to MongoDB
    const newVmap = await VmapFile.create({
      fileName,
      vmapXml,
    });

    // Build the XML link
    const xmlLink = `${req.protocol}://${req.get("host")}/api/vmap-config/${
      newVmap._id
    }.xml`;

    // Save the link in VmapLink table
    await VmapLink.create({
      vmapId: newVmap._id,
      link: xmlLink,
    });

    res.json({
      message: "✅ VMAP XML created",
      xmlLink,
      fileName,
      vmapId: newVmap._id,
    });
  } catch (err) {
    console.error("Error creating VMAP XML:", err);
    res
      .status(500)
      .json({ message: "Failed to create VMAP XML", error: err.message });
  }
});
router.get("/:id.xml", async (req, res) => {
  try {
    const vmap = await VmapFile.findById(req.params.id);
    if (!vmap) return res.status(404).send("Not found");
    res.set("Content-Type", "application/xml");
    res.send(vmap.vmapXml);
  } catch (error) {
    res.status(500).send("Server error");
  }
});
router.get("/links/all", async (req, res) => {
  try {
    const links = await VmapLink.find().populate("vmapId");
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch VMAP links" });
  }
});

module.exports = router;
