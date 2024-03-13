var express = require("express");
var router = express.Router();

require("../models/connection");

const User = require("../models/user");
const Review = require("../models/review");
const { checkBody } = require("../modules/checkBody");
const bcrypt = require("bcrypt");
const uid2 = require("uid2");

const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const uniqid = require("uniqid");

const EMAIL_REGEX =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

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
  console.log("signup route");
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
          console.log("back : ", data.profilePicture);
          res.json({ result: true, user: data });
        });
      } else {
        res.json({ result: false, error: "Utilisateur deja existant" });
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

    User.findOne({ email: { $regex: new RegExp(req.body.email, "i") } }).then(
      (data) => {
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
        }
      }
    );
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
});

//newReview and saveReview Router

router.post("/user/review", async (req, res) => {
  if (!checkBody(req.body, ["review"])) {
    res.json({ result: false, error: "Veuillez rentrer un avis" });
    return;
  }
  const newReview = new Review({
    sender: req.body.sender,
    receiver: req.body.receiver,
    date: req.body.date,
    likes: req.body.likes,
    review: req.body.review,
  });

  try {
    const savedReview = await newReview.save();
    res.json({ success: true, data: savedReview });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

//diplayReview Router

router.get("/user/reviews", async (req, res) => {
  try {
    const reviews = await Review.find();
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
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

  console.log("password => ", password);
  console.log("passwordBool", Boolean(password));

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
  User.findOne({ token: req.params.token }).then((data) => {
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

//nouvelle route pour recuperer la donnée profilepicture et nickname
/*router.get("/user/ReviewUser/:token", async (req, res) => {
  try {
    const token = req.params.token;
    const user = await User.findOne({ token }).select(
      "nickname profilePicture"
    );
    if (user) return res.json({ result: true, user });

    res.json({ result: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});*/

//Route pour ajouter des matchs
router.put("/user/match/:token", async (req, res) => {
  try {
    const newUserId = req.body.newUserId;
    const token = req.params.token;

    const updatedUser = await User.findOneAndUpdate(
      { token: token },
      { $push: { match: newUserId } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé", error });
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

module.exports = router;
