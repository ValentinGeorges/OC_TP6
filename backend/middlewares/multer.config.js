const multer = require('multer');
const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png'
};

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, 'images');
    },
    filename: (req, file, callback) => {
        const extension = MIME_TYPES[file.mimetype];
        let name = file.originalname.split(' ').join('_'); // replacing spaces with '_'
        name = name.split('.' + extension)[0]; // filtering name
        callback(null, name + Date.now() + '.' + extension);// date.now() allows to have an unique filename
    }
});

module.exports = multer({storage: storage}).single('image');