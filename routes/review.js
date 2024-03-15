var express = require("express");
var router = express.Router();

require("../models/connection");

const Review = require("../models/user");
const { checkBody } = require("../modules/checkBody");

//addReview and saveReview Router

router.post("/review", async (req, res) => {
  if (!checkBody(req.body, ["stars", "review"])) {
    return res
      .status(400)
      .json({ result: false, error: "Veuillez rentrer un avis" });
  }

  const sender = await Review.findOne({ token: req.body.sender });

  const newReview = {
    sender: sender.nickname,
    date: req.body.date,
    stars: req.body.stars,
    review: req.body.review,
  };

  try {
    await Review.updateOne(
      { token: req.body.receiver },
      { $addToSet: { reviews: newReview } }
    );

    return res.json({ success: true, data: newReview });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

//displayReview Router

router.get("/review/:token", async (req, res) => {
  try {
    const user = await Review.findOne({ token: res.params.token }).lean();
    console.log(user.reviews);
    res.json({ success: true, reviews: user.reviews || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
