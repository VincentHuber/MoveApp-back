var express = require('express');
var router = express.Router();

require('../models/connection');

const User = require('../models/user');
const Review = require('../models/review');
const { checkBody } = require('../modules/checkBody');
const bcrypt = require("bcrypt");
const uid2 = require('uid2');

const cloudinary = require('cloudinary').v2;
const fs = require('fs');


// SignUp router
router.post('/signup', (req, res) => {

  if (!checkBody(req.body, ['nickname', 'mail', 'password', 'adress', 'sports'])) {
    res.json({ result: false, error: 'Un des champs est manquant ou vide' });
    return;
  }

  User.findOne({ nickname: { $regex: new RegExp(req.body.nickname, 'i') } }).then(data => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);

      const newUser = new User({
        nickname: req.body.nickname,
        mail: req.body.mail,
        description:req.body.description,
        ambition:req.body.ambition,
        coverPicture:req.body.coverPicture,
        profilePicture:req.body.profilePicture,
        password: hash,
        adress: req.body.adress,
        sports:req.body.sports,
        token: uid2(32),
      });
     
      newUser.save().then(data => {
        res.json({ result: true, data});
      });
    } else {
      res.json({ result: false, error: 'Utilisateur déjà existant' });
    }
  }).catch(error => {
    console.error("Erreur:", error);
    res.json({ result: false, error: 'Erreur' });
  });
});


// SignIn router
router.post('/signin', (req, res) => {
  if (!checkBody(req.body, ['mail', 'password'])) {
    res.json({ result: false, error: 'Un des champs est manquant ou vide' });
    return;
  }

  User.findOne({ mail: { $regex: new RegExp(req.body.mail, 'i') } }).then(data => {
    if (data) {
      if (bcrypt.compareSync(req.body.password, data.password)) {
        res.json({ result: true, token: data.token, mail: data.mail });
      } else {
        res.json({ result: false, error: 'Mot de passe incorrect' });
      }
    } else {
      res.json({ result: false, error: 'Utilisateur introuvable' });
    }
  }).catch(error => {
    console.error("Erreur:", error);
    res.json({ result: false, error: 'Erreur' });
  });
});


// LogOut router
router.get('/logout', (res, req)=>{


  res.json({result:true, message:'Utilisateur déconnecté'})
})


//Upload cover picture router 

router.post('/uploadPictureCover', async (req, res) => {
    if (req.files && req.files.coverPicture) {
      const photoPath = `./tmp/coverPicture.jpg`;
      const resultMove = await req.files.coverPicture.mv(photoPath);
  
      if (!resultMove) {
        const resultCloudinary = await cloudinary.uploader.upload(photoPath);
        fs.unlinkSync(photoPath);
        res.json({ result: true, url: resultCloudinary.secure_url });
      } else {
        res.json({ result: false, error: resultMove });
      }
    } else {
      res.status(400).json({ error: "Aucun fichier 'coverPicture' n'a pas été fourni dans la requête." });
    }
  });


  //Upload profile picture router 

router.post('/uploadProfileCover', async (req, res) => {
  if (req.files && req.files.profilePicture) {
    const photoPath = `./tmp/profilePicture.jpg`;
    const resultMove = await req.files.profilePicture.mv(photoPath);

    if (!resultMove) {
      const resultCloudinary = await cloudinary.uploader.upload(photoPath);
      fs.unlinkSync(photoPath);
      res.json({ result: true, url: resultCloudinary.secure_url });
    } else {
      res.json({ result: false, error: resultMove });
    }
  } else {
    res.status(400).json({ error: "Aucun fichier 'profilePicture' n'a pas été fourni dans la requête." });
  }
});


//diplayReview

router.get('/reviews', async (req, res) => {
  try {
    const reviews = await Review.find();
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

//newReview and saveReview

router.post ('/review', async (req, res)=>{
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

 

//diplayReview

router.get('/reviews', async (req, res) => {
  try {
    const reviews = await Review.find();
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


  




module.exports = router;
