var express = require("express");
var router = express.Router();

require("../models/connection");

const User = require("../models/user");
const Message = require("../models/message");

//Route pour envoyer un message

router.post("/chat", async (req, res) => {
  try {
    const newToken = req.body.newToken;
    console.log("newToken : ", newToken)
    const token = req.body.token;
    console.log("token : ", token)
    const newMessageContent = req.body.newMessageContent;

    // Recherche de l'utilisateur destinataire
    const newUser = await User.findOne({ token: newToken });
    if (!newUser) {
      return res
        .status(404)
        .json({ message: "Utilisateur destinataire non trouvé", error });
    }
    const newId = newUser._id;

    // Recherche de l'utilisateur expéditeur
    const user = await User.findOne({ token: token });
    if (!user) {
      return res
        .status(404)
        .json({ message: "Utilisateur expéditeur non trouvé", error });
    }
    const id = user._id;

    // Création du nouveau message
    const newMessage = new Message({
      sender: id,
      receiver: newId,
      message: newMessageContent,
    });

    // Sauvegarde du message et envoi de la réponse
    await newMessage.save();
    res.status(200).json({ result: true });

  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la création du message", error });
  }
});

//Route pour montrer tous les messages
router.get("/chat/:newToken/:token", async (req, res) => {
  try {
    const newToken = req.params.newToken;
    
    const token = req.params.token;

    // Recherche de l'utilisateur destinataire
    const newUser = await User.findOne({ token: newToken });
    if (!newUser) {
      return res
        .status(404)
        .json({ message: "Utilisateur destinataire non trouvé", error });
    }
    const newId = newUser._id;

    // Recherche de l'utilisateur expéditeur
    const user = await User.findOne({ token: token });
    if (!user) {
      return res
        .status(404)
        .json({ message: "Utilisateur expéditeur non trouvé", error });
    }
    const id = user._id;
    
    // Recherche des messages ayant l'ID de l'utilisateur expéditeur
    // et l'ID de l'utilisateur destinataire
    const message = await Message.find({
      $or: [
        { sender: id, receiver: newId },
        { sender: newId, receiver: id },
      ],
    }).populate("sender receiver", "token");


    console.log('message : ', message)

    res.status(200).json({ message });

  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erreur lors de la recherche des messages",
        error: error.message,
      });
  }
});



module.exports = router;
