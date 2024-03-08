var express = require('express');
var router = express.Router();

require('../models/connection');

const Review = require('../models/review');
const { checkBody } = require('../modules/checkBody');


//addReview and saveReview Router

router.post ('/review', async (req, res)=>{
    if (!checkBody(req.body, ['review'])) {
      return res.status(400).json({ result: false, error: 'Veuillez rentrer un avis' });
    }
    const newReview = new Review ({
      
      sender: req.body.sender,
      receiver: req.body.receiver,
      date: req.body.date,
      likes: req.body.likes,
      review : req.body.review,
    });  
  
    try {
      const savedReview = await newReview.save();
      res.json({ success: true, data: savedReview });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
   
  
  //displayReview Router
  
  router.get('/review', async (req, res) => {
    try {
      const reviews = await Review.find();
      res.json({ success: true, data: reviews });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  module.exports = router;