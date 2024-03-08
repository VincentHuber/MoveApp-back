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
const uniqid = require('uniqid');



// SignUp router
router.post('/user/signup', (req, res) => {
  console.log('signup route')
  console.log(req.body)
  if (!checkBody(req.body, ['nickname', 'email', 'password', 'adress', 'sports'])) {
    res.json({ result: false, error: 'Un des champs est manquant ou vide' });
    return;
  }

  User.findOne({ nickname: { $regex: new RegExp(req.body.nickname, 'i') } }).then(data => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);

      const newUser = new User({
        nickname: req.body.nickname,
        email: req.body.email,
        description: req.body.description,
        ambition: req.body.ambition,
        password: hash,
        isLog: true,
        adress: req.body.adress,
        sports:req.body.sports,
        profilePicture:req.body.profilePicture,
        coverPicture:req.body.coverPicture,
        token: uid2(32),
      });
     
      newUser.save().then(data => {
        res.json({ result: true, 
          nickname : data.nickname,
          description : data.description,
          ambition : data.ambition,
          adress : data.adress,
          sports : data.sports,
          profilePicture:data.profilePicture,
          coverPicture:data.coverPicture,
         });
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
router.post('/user/signin', (req, res) => {
  if (!checkBody(req.body, ['email', 'password'])) {
    res.json({ result: false, error: 'Un des champs est manquant ou vide' });
    return;
  }

  User.findOne({ email: { $regex: new RegExp(req.body.email, 'i') } }).then(data => {
    if (data) {
        if (bcrypt.compareSync(req.body.password, data.password)) {
            User.updateOne(
                { email: req.body.email },
                { isLog: true }
            ).then(() => {
                res.json({ result: true, token: data.token, email: data.email });
            }).catch(error => {
                console.error("Erreur de la mise à jour:", error);
                res.json({ result: false, error: 'Erreur de la mise à jour' });
            });
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
router.put('/user/logout', (req, res)=>{
  
  User.updateOne(
    { token: token },
    { isLog: false }
  ).then(() => {
    res.json({ result: true, token: data.token, email: data.email });
  }).catch(error => {
    console.error("Erreur de déconnexion:", error);
    res.json({ result: false, error: 'Erreur de déconnexion' });
  });
});

// Get users infos
router.get('/user/:nickname', (req, res) => {
  User.find({ nickname: {$regex: new RegExp(req.params.nickname, 'i')} }).then(data => {
    if (data) {
      res.json({ result: true, users: data });
    } else {
      res.json({ result: true, error: 'Nickname not found' });
    }
  });
});


//Upload cover picture router 
router.post('/user/uploadPictureCover', async (req, res) => {
    if (req.files && req.files.coverPicture) {
        const photoPath = `./tmp/${uniqid()}.jpg`;
        const resultMove = await req.files.coverPicture.mv(photoPath);
        
        if (!resultMove) {
          console.log('in condition 2')
            const resultCloudinary = await cloudinary.uploader.upload(photoPath);
            fs.unlinkSync(photoPath);
            res.json({ result: true, url: resultCloudinary.secure_url });
        } else {
            res.json({ result: false, error: resultMove });
        }
    } else {
        console.error("Erreur: Aucun fichier 'coverPicture' n'a été fourni dans la requête.");
        res.status(400).json({
            error: "Aucun fichier 'coverPicture' n'a été fourni dans la requête."
        });
    }
});


//Upload profile picture router 
router.post('/user/uploadProfileCover', async (req, res) => {
  if (req.files && req.files.profilePicture) {
    const photoPath = `./tmp/${uniqid()}.jpg`;
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


//newReview and saveReview Router

/*router.post ('/user/review', async (req, res)=>{
  if (!checkBody(req.body, ['review'])) {
    res.json({ result: false, error: 'Veuillez rentrer un avis' });
    return;
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

 

//diplayReview Router

router.get('/user/reviews', async (req, res) => {
  try {
    const reviews = await Review.find();
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});*/

 
// Update user profile router
router.put('/user/updateProfile', (req, res) => {
  const { token, nickname, email, password, address, description, sports, ambition, coverPicture, profilePicture } = req.body;

  if (!token) {
    return res.json({ result: false, error: "Token invalide" });
  }

  // Construire l'objet de mise à jour
  const updateFields = {};
  if (nickname) updateFields.nickname = nickname;
  if (email) updateFields.email = email;
  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    updateFields.password = hash;
  }
  if (address) updateFields.adress = address;
  if (description) updateFields.description = description;
  if (sports) updateFields.sports = sports;
  if (ambition) updateFields.ambition = ambition;
  if (coverPicture) updateFields.coverPicture = coverPicture;
  if (profilePicture) updateFields.profilePicture = profilePicture;

  // Mettre à jour l'utilisateur
  User.findOneAndUpdate(
    { token: token },
    { $set: updateFields },
    { new: true } 
  ).then(updatedUser => {
    if (updatedUser) {
      res.json({ result: true, data: updatedUser });
    } else {
      res.json({ result: false, error: 'Utilisateur introuvable' });
    }
  }).catch(error => {
    console.error("Erreur de mise à jour du profil:", error);
    res.json({ result: false, error: 'Erreur de mise à jour du profil' });
  });
});


module.exports = router;