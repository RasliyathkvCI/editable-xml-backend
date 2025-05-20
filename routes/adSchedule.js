const express = require("express");
const AdSchedule = require("../models/AdSchedule");

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { type, adUrl, duration, adId, timeOffset } = req.body;

    if (!type || !adUrl) {
      return res.status(400).json({ error: "type and adUrl are required" });
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

    // Save all data + generated link in one document
    const newAd = new AdSchedule({
      type,
      adUrl,
      duration: safeDuration,
      adId: safeAdId,
      timeOffset,
      vastXml,
      updatedAt: new Date(),
    });

    await newAd.save();
    newAd.vastLink = `${req.protocol}://${req.get("host")}/api/vast-schedule/${
      newAd._id
    }.xml`;
    await newAd.save();

    return res.status(201).json({
      message: "VAST XML created and saved with link",
      id: newAd._id,
      adId: safeAdId,
      xmlLink: newAd.vastLink,
      timeOffset,
      vastAd: newAd,
    });
  } catch (error) {
    console.error("Error creating VAST XML:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
router.put("/:id", async (req, res) => {
  try {
    const updatedAd = await AdSchedule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // return updated document
    );

    if (!updatedAd) {
      return res.status(404).json({
        success: false,
        message: "Ad entry not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ad entry updated successfully",
      data: updatedAd,
    });
  } catch (err) {
    console.error("Error updating Ad entry:", err); // or use your Winston logger
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.get("/:id.xml", async (req, res) => {
  try {
    const ad = await AdSchedule.findById(req.params.id);
    if (!ad) return res.status(404).send("Not found");
    res.set("Content-Type", "application/xml");
    res.send(ad.vastXml);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

router.get("/all", async (req, res) => {
  try {
    const allAds = await AdSchedule.find().sort({ updatedAt: -1 }); // newest first
    res.status(200).json(allAds);
  } catch (err) {
    console.error("Error fetching VAST ads:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.delete("/:id", async (req, res) => {
  try {

    const deleted = await AdSchedule.findOneAndDelete(req.params.id);

    if (!deleted) return res.status(404).json({ error: "Ad not found" });

    res.status(200).json({ message: "Ad deleted", deletedAd: deleted });
  } catch (err) {
    console.error("Error deleting VAST ad:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
