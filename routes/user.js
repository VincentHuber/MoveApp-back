var express = require("express");
var router = express.Router();

require("../models/connection");

const User = require("../models/user");
const { checkBody } = require("../modules/checkBody");
const bcrypt = require("bcrypt");
const uid2 = require("uid2");

const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const uniqid = require("uniqid");

//Upload cover picture router
router.post("/user/uploadPictureCover/:token", async (req, res) => {
  const token = req.params.token;

  if (req.files && req.files.coverPicture) {
    const photoPath = `./tmp/${uniqid()}.jpg`;
    const resultMove = await req.files.coverPicture.mv(photoPath);

    if (!resultMove) {
      console.log("in condition 2");
      const resultCloudinary = await cloudinary.uploader.upload(photoPath);
      fs.unlinkSync(photoPath);
      await User.updateOne(
        { token },
        { coverPicture: resultCloudinary.secure_url }
      );
      res.json({ result: true, url: resultCloudinary.secure_url });
    } else {
      res.json({ result: false, error: resultMove });
    }
  } else {
    console.error(
      "Erreur: Aucun fichier 'coverPicture' n'a été fourni dans la requête."
    );
    res.status(400).json({
      error: "Aucun fichier 'coverPicture' n'a été fourni dans la requête.",
    });
  }
});

//Upload profile picture router
router.post("/user/uploadProfileCover/:token", async (req, res) => {
  const token = req.params.token;

  if (req.files && req.files.profilePicture) {
    const photoPath = `./tmp/${uniqid()}.jpg`;
    const resultMove = await req.files.profilePicture.mv(photoPath);

    if (!resultMove) {
      const resultCloudinary = await cloudinary.uploader.upload(photoPath);
      fs.unlinkSync(photoPath);
      await User.updateOne(
        { token },
        { profilePicture: resultCloudinary.secure_url }
      );
      res.json({ result: true, url: resultCloudinary.secure_url });
    } else {
      res.json({ result: false, error: resultMove });
    }
  } else {
    res.status(400).json({
      error:
        "Aucun fichier 'profilePicture' n'a pas été fourni dans la requête.",
    });
  }
});

// SignUp router

router.post("/user/signup", (req, res) => {
  console.log(req.body);
  if (
    !checkBody(req.body, ["nickname", "email", "password", "adress", "sports"])
  ) {
    res.json({ result: false, error: "Un des champs est manquant ou vide" });
    return;
  }

  User.findOne({ nickname: { $regex: new RegExp(req.body.nickname, "i") } })
    .then((data) => {
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
          sports: req.body.sports,
          profilePicture: req.body.profilePicture,
          coverPicture: req.body.coverPicture,
          token: uid2(32),
        });

        newUser.save().then((data) => {
          console.log("back");
          res.json({ result: true, user: data });
        });
      } else {
        res.json({ result: false, error: "Utilisateur déjà existant" });
      }
    })
    .catch((error) => {
      console.error("Erreur:", error);
      res.json({ result: false, error: "Erreur" });
    });
});

// SignIn router
router.post("/user/signin", (req, res) => {
  try {
    if (!checkBody(req.body, ["email", "password"])) {
      res.json({ result: false, error: "Un des champs est manquant ou vide" });
      return;
    }

    User.findOne({ email: { $regex: new RegExp(req.body.email, "i") } })
      .then((data) => {
        console.log("data => ", data);
        console.log(
          "password resp => ",
          bcrypt.compareSync(req.body.password, data.password)
        );
        if (data && bcrypt.compareSync(req.body.password, data.password)) {
          res.json({ result: true, email: data.email, token: data.token });
        } else {
          res.json({
            result: false,
            error: "Utilisateur non trouvé ou mot de passe erroné",
          });
          res.json({
            result: false,
            error: "Utilisateur non trouvé ou mot de passe erroné",
          });
        }
      })
      .catch((error) => {
        console.error("Erreur de connexion:", error);
        res.json({ result: false, error: "Erreur de connexion" });
      });
  } catch (error) {
    res.status(500).json({ message: "error", error });
  }
});

// LogOut router

router.put("/user/logout", (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.json({ result: false, error: "Token invalide" });
  }

  User.updateOne({ token: token }, { isLog: false })
    .then(() => {
      res.json({ result: true, token: data.token, email: data.email });
    })
    .catch((error) => {
      console.error("Erreur de déconnexion:", error);
      res.json({ result: false, error: "Erreur de déconnexion" });
    });
  if (!token) {
    return res.json({ result: false, error: "Token invalide" });
  }

  User.updateOne({ token: token }, { isLog: false })
    .then(() => {
      res.json({ result: true, token: data.token, email: data.email });
    })
    .catch((error) => {
      console.error("Erreur de déconnexion:", error);
      res.json({ result: false, error: "Erreur de déconnexion" });
    });
});

// Update user profile router
router.put("/user/updateProfile/:token", (req, res) => {
  const {
    nickname,
    email,
    password,
    adress,
    description,
    sports,
    ambition,
    coverPicture,
    profilePicture,
  } = req.body;
  const token = req.params.token;

  if (!token) {
    return res.json({ result: false, error: "Token invalide" });
  }

  // Construire l'objet de mise à jour
  const updateFields = {};
  if (nickname) updateFields.nickname = nickname;
  if (email) updateFields.email = email;
  if (adress) updateFields.adress = adress;
  if (description) updateFields.description = description;
  if (sports) updateFields.sports = sports;
  if (ambition) updateFields.ambition = ambition;
  if (coverPicture) updateFields.coverPicture = coverPicture;
  if (profilePicture) updateFields.profilePicture = profilePicture;

  // Mettre à jour l'utilisateur
  User.findOneAndUpdate({ token: token }, { $set: updateFields })
    .then((updatedUser) => {
      if (updatedUser) {
        res.json({ result: true, data: updatedUser });
      } else {
        res.json({ result: false, error: "Utilisateur introuvable" });
      }
    })
    .catch((error) => {
      console.error("Erreur de mise à jour du profil:", error);
      res.json({ result: false, error: "Erreur de mise à jour du profil" });
    });
});

// Get users infos
router.get("/user/:token", (req, res) => {
  console.log("lol");
  User.findOne({ token: req.params.token }).then((data) => {
    console.log("data", data);
    if (data) {
      res.json({ result: true, user: data });
    } else {
      res.json({ result: true, error: "Nickname not found" });
    }
  });
});

// Get pour récupérer toutes les infos des autres users
router.get("/users", (req, res) => {
  let filter = {};
  if (req.query.nickname) {
    filter.nickname = req.query.nickname;
  }

  User.find(filter)
    .then((data) => {
      if (data.length > 0) {
        res.json({ result: true, users: data });
      } else {
        res.json({ result: false, error: "No users found" });
      }
    })
    .catch((error) => {
      console.error("Error fetching users from database:", error);
      res.json({ result: false, error: "Error fetching users from database" });
    });
});

//Route pour ajouter des matchs
router.put("/user/match/:token", async (req, res) => {
  try {
    const newToken = req.body.newMatch;
    const token = req.params.token;
    console.log("newToken => ", newToken)
    let newId;

    // Recherche de l'utilisateur associé au nouveau token
    const foundUser = await User.findOne({ token: newToken });
    if (foundUser) {
      console.log("NOUVEAU => ", foundUser._id);
      newId = foundUser._id;
    } else {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Mise à jour de l'utilisateur avec le nouvel ID de match
    const updatedUser = await User.findOneAndUpdate(
      { token: token },
      { $addToSet: { match: newId } }, // Ajoute l'ID uniquement s'il n'est pas déjà présent
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Erreur lors de la mise à jour du match :", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour du match" });
  }
});

//route pour mettre a jour la moyenne de notatation par étoile de l'utilisateur
router.put("/user/updateAverageStar/:token", async (req, res) => {
  try {
    const token = req.params.token;
    const { averageStar } = req.body;

    console.log(averageStar);

    const user = await User.findOneAndUpdate(
      { token: token },
      { averageStar },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.json({ result: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Route pour renvoyer les utilisateurs avec qui on parle
router.get("/user/menu/:token", (req, res) => {
  User.findOne({ token: req.params.token })
    .then((data) => {
      if (data) {
        const menu = data.match; 
        console.log("Matches: ", menu);
        
        // Rechercher les utilisateurs
        User.find({ _id: { $in: menu } })
          .then((users) => {
            console.log("Users: ", users);
            res.json({ result: true, users: users });
          })
          .catch((error) => {
            console.error("Error fetching matched users:", error);
            res.json({ result: false, error: "Error fetching matched users" });
          });
      } else {
        res.json({ result: false, error: "User not found" });
      }
    })
    .catch((error) => {
      console.error("Error fetching user:", error);
      res.json({ result: false, error: "Error fetching user" });
    });
});



module.exports = router;
