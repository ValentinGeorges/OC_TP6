const Sauce = require('../models/sauce');
const fs = require('fs');

exports.getAllSauce = (req, res, next) => {
    Sauce.find()
      .then(sauces => res.status(200).json(sauces))
      .catch(error => res.status(400).json({error}));
};

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  const sauce = new Sauce({
    ...sauceObject,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });
  sauce.likes = 0;
  sauce.dislikes = 0;
  sauce.usersLiked = [];
  sauce.usersDisliked = [];
  sauce.save()
    .then(() => res.status(201).json({message: 'Object registered'}))
    .catch(error => res.status(400).json({error}));
};

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({_id: req.params.id})
    .then((sauce) => res.status(200).json(sauce))
    .catch(error => res.status(404).json({error}));
};

exports.modifySauce = (req, res, next) => {
    let sauceObject = {};
    let oldImageUrl = '';
    // Checking if the static file must be changed
    if (req.file) {
      sauceObject = 
        {
          ...JSON.parse(req.body.sauce),
          imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        };
        // Getting the old image
        Sauce.findOne({_id: req.params.id}, 'imageUrl')
          .then((res) => {oldImageUrl = res.imageUrl;})
          .catch((err) => {err});
    }else {
      sauceObject = {...req.body};
    }
    Sauce.updateOne({_id: req.params.id}, {...sauceObject, _id: req.params.id})
      .then(() => {
          res.status(200).json({message: 'Object modified'})
          // Deleting the old image
          const filename = oldImageUrl.split('/images/')[1];
          fs.unlink(`images/${filename}`, () => {});
      })
      .catch(error => res.status(400).json({ error }));
};

exports.deleteSauce = (req, res, next) => { // Also deletes static images in the file (/images)
  Sauce.findOne({_id: req.params.id}, 'imageUrl')
    .then(dataImage => {
      const filename = dataImage.imageUrl.split('/images/')[1];
      fs.unlink(`images/${filename}`, () => { // Deletes the image on the server
        Sauce.deleteOne({_id: req.params.id}) // Deletes the sauce from the BDD
          .then(() => res.status(200).json({message: 'Object deleted'}))
          .catch(error => res.status(400).json({error}));
      });
    })
    .catch(error => res.status(500).json({error}));
};

exports.likeSauce = (req, res, next) => {
    const like = req.body.like;
    const userId = req.body.userId;
    // Like
    if (like === 1 ) { 
      // Add a like
      Sauce.updateOne({_id: req.params.id}, 
            {  
              $inc: {likes: 1} ,
              $push: {usersLiked : req.body.userId} ,
                _id: req.params.id 
            })
        .then(() => res.status(200).json({message: 'Like added'}))
        .catch(error => res.status(400).json({error}));
    } 
    //Dislike
    if (like === -1 ) { 
      // Add a dislike
      Sauce.updateOne({_id: req.params.id}, 
              {  
              $inc: {dislikes: 1} ,
              $push: {usersDisliked : req.body.userId} ,
                _id: req.params.id 
              })
        .then(() => res.status(200).json({message: 'Dislike added'}))
        .catch(error => res.status(400).json({error}));
    } 
    // Cancelling like/dislike
    if (like === 0) {
      Sauce.findOne({_id: req.params.id} , ['usersLiked', 'usersDisliked'])
            .then((users) => {
                if (users.usersLiked.includes(userId)) { // User already liked
                // Removes the like
                Sauce.updateOne({_id: req.params.id}, 
                      {  
                      $inc: {likes: -1} ,
                      $pull: {usersLiked : req.body.userId} ,
                        _id: req.params.id 
                      })
                  .then(() => res.status(200).json({message: 'Like removed'}))
                  .catch(error => res.status(400).json({error}));
              }
              if (users.usersDisliked.includes(userId)) { // User already disliked
                // Removes the dislike
                Sauce.updateOne({_id: req.params.id}, 
                      {  
                      $inc: {dislikes: -1} ,
                      $pull: {usersDisliked : req.body.userId} ,
                        _id: req.params.id 
                      })
                  .then(() => res.status(200).json({message: 'Dislike removed'}))
                  .catch(error => res.status(400).json({error}));
              }
            })
            .catch(error => res.status(404).json({error}));
    }
};