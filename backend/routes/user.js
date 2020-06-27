const express = require('express');
const userCtrl = require('../controllers/user');
const bouncer = require('express-bouncer')(500, 8640000, 3);

const router = express.Router();

router.post('/signup', userCtrl.signup);
router.post('/login', bouncer.block, userCtrl.login);


module.exports = router;