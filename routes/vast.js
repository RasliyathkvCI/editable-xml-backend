const express = require("express");
const fs = require("fs");
const path = require("path");
const VastAd = require("../models/VastAd");
const VastLink = require("../models/VastLink");

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { type, adUrl, duration, adId, timeOffset } = req.body;

    if (!type || !adUrl) {
      return res
        .status(400)
        .json({ error: "rollType and videoUrl are required" });
    }

    const safeDuration = duration || "00:00:05";
    const safeAdId = adId || `${type}-${Date.now()}`;

    // Build VAST XML content
    const vastXml = `
<VAST version="3.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Ad id="${safeAdId}">
    <InLine>
      <AdSystem>Sample Ad Server</AdSystem>
      <AdTitle>${type} Ad</AdTitle>
      <Creatives>
        <Creative>
          <Linear>
            <Duration>${safeDuration}</Duration>
            <MediaFiles>
              <MediaFile delivery="progressive" type="video/mp4" width="640" height="360">
                ${adUrl.trim()}
              </MediaFile>
            </MediaFiles>
          </Linear>
        </Creative>
      </Creatives>
    </InLine>
  </Ad>
</VAST>`.trim();

    // Save to VastAd collection (no file writing)
    const newAd = await VastAd.create({
      type,
      adUrl,
      duration: safeDuration,
      adId: safeAdId,
      vastXml, 
      timeOffset 
    });
    // Build the XML link
    const xmlLink = `${req.protocol}://${req.get("host")}/api/vast/${
      newAd._id
    }.xml`;

    // Save the link in VastLink table
    await VastLink.create({
      vastId: newAd._id,
      link: xmlLink,
    });
    return res.status(201).json({
      message: "VAST XML created",
      id: newAd._id,
      adId: safeAdId,
      xmlLink,
      timeOffset ,
      vastAd: newAd,
    });
  } catch (error) {
    console.error("Error creating VAST XML:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Serve VAST XML as raw XML by MongoDB _id
router.get("/:id.xml", async (req, res) => {
  try {
    const vast = await VastAd.findById(req.params.id);
    if (!vast) return res.status(404).send("Not found");
    res.set("Content-Type", "application/xml");
    res.send(vast.vastXml);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

// 📄 GET ALL VAST Ads
router.get("/", async (req, res) => {
  try {
    const vastAds = await VastAd.find().sort({ createdAt: -1 });
    const host = `${req.protocol}://${req.get("host")}`;
    const vastAdsWithLinks = vastAds.map((ad) => ({
      ...ad.toObject(),
      xmlLink: `${host}/api/vast/${ad._id}.xml`,
    }));
    res.json(vastAdsWithLinks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch VAST ads" });
  }
});

// 🔍 GET SINGLE VAST Ad by ID
router.get("/:id", async (req, res) => {
  try {
    const vast = await VastAd.findById(req.params.id);
    if (!vast) return res.status(404).json({ error: "VAST Ad not found" });
    res.json(vast);
  } catch (error) {
    res.status(500).json({ error: "Error fetching VAST ad" });
  }
});

// ✏️ UPDATE VAST Ad
router.put("/:id", async (req, res) => {
  try {
    const updated = await VastAd.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ error: "VAST Ad not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Error updating VAST ad" });
  }
});

// ❌ DELETE VAST Ad and Related VMAPs
router.delete("/:id", async (req, res) => {
  try {
    const vast = await VastAd.findByIdAndDelete(req.params.id);
    if (!vast) return res.status(404).json({ error: "VAST Ad not found" });

    // Delete related VMAPs
    await VastAd.deleteMany({ vastId: vast._id });

    // Delete XML file if exists
    const filename = `${vast.adId}.xml`;
    const filepath = path.join(__dirname, "..", "public", "xml", filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

    res.json({ message: "VAST Ad and related VMAPs deleted" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting VAST ad" });
  }
});

module.exports = router;
