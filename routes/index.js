var express = require('express');
var router = express.Router();

require('../models/connection');

const User = require('../models/user');
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
 

// Update user profile router
router.put('/update/:userToken', (req, res) => {
  const userToken = req.params.userToken; // Récupérer le token d'utilisateur depuis l'URL
  const updateFields = {};

  // Construire l'objet contenant les champs à mettre à jour
  if (req.body.nickname) {
    updateFields.nickname = req.body.nickname;
  }
  if (req.body.mail) {
    updateFields.mail = req.body.mail;
  }
  if (req.body.password) {
    const hash = bcrypt.hashSync(req.body.password, 10);
    updateFields.password = hash;
  }
  if (req.body.adress) {
    updateFields.adress = req.body.adress;
  }
  if (req.body.description) {
    updateFields.description = req.body.description;
  }
  if (req.body.ambition) {
    updateFields.ambition = req.body.ambition;
  }
  if (req.body.coverPicture) {
    updateFields.coverPicture = req.body.coverPicture;
  }
  if (req.body.profilePicture) {
    updateFields.profilePicture = req.body.profilePicture;
  }
  if (req.body.sports) {
    updateFields.sports = req.body.sports;
  }

  User.update({ token: userToken }, { $set: updateFields }, (err) => {
    if (err) {
      console.error("Erreur:", err);
      return res.json({ result: false, error: 'Erreur lors de la mise à jour du profil utilisateur' });
    }
    res.json({ result: true, message: 'Profil utilisateur mis à jour avec succès' });
  });
});


module.exports = router;