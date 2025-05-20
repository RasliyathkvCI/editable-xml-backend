const express = require("express");
const router = express.Router();
const Vmap = require("../models/VmapSchedule");

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

    // Generate a unique fileName
    const fileName = `vmap-${Date.now()}.xml`;

    // Generate XML link
    // const xmlLink = `${req.protocol}://${req.get("host")}/api/vmap-config/${fileName}`;

    // Save everything in one document
    const newVmap = await Vmap.create({
      fileName,
      vmapXml,
    
    });
    const xmlLink = `${req.protocol}://${req.get("host")}/api/vmap-schedule/${
      newVmap._id
    }.xml`;
    newVmap.xmlLink = xmlLink;
    await newVmap.save();
    res.status(201).json({
      message: "✅ VMAP XML created",
      xmlLink: newVmap.xmlLink,
      fileName: newVmap.fileName,
      vmapId: newVmap._id,
    });
  } catch (err) {
    console.error("Error creating VMAP XML:", err);
    res
      .status(500)
      .json({ message: "Failed to create VMAP XML", error: err.message });
  }
});
// UPDATE a VMAP entry by ID
router.put("/:id", async (req, res) => {
  try {
    const updatedVmap = await Vmap.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedVmap) {
      return res.status(404).json({
        success: false,
        message: "VMAP entry not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "VMAP entry updated successfully",
      data: updatedVmap,
    });
  } catch (err) {
    logger.error("Error updating VMAP entry:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// GET all VMAP entries
router.get("/", async (req, res) => {
  try {
    const vmapEntries = await Vmap.find();
    res.status(200).json({
      success: true,
      message: "All VMAP entries retrieved",
      data: vmapEntries,
    });
  } catch (err) {
    logger.error("Error fetching VMAP entries:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});
// GET /api/vmap-config/:id.xml
router.get("/:id.xml", async (req, res) => {
  try {
     
    const id = req.params.id.replace(".xml", "");
    const vmap = await Vmap.findById(id);
    if (!vmap) {
      return res.status(404).send("VMAP not found");
    }
    res.set("Content-Type", "application/xml");
    res.send(vmap.vmapXml);
  } catch (err) {
    console.error("Error fetching VMAP:", err);
    res.status(500).send("Server error");
  }
});
// DELETE a VMAP entry by ID
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Vmap.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "VMAP entry not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "VMAP entry deleted successfully",
    });
  } catch (err) {
    logger.error("Error deleting VMAP entry:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
