
const express = require('express');

const authController = require('../controllers/auth.js');
const authValidator = require('../validators/auth.js'); 

const User = require('../models/user.js');

const router = express.Router();


router.get( '/login', authController.getLogin );

router.get('/signup', authController.getSignup);

router.get('/reset', authController.getReset);

router.get('/reset/:token', authController.getNewPassword);


router.post( '/login', authValidator.loginValidator ,authController.postLogin );


router.post('/signup',authValidator.signupValidator,authController.postSignup );


router.post( '/logout', authController.postLogout );

router.post('/reset', authController.postReset);

router.post('/new-password', authController.postNewPassword);




module.exports = router;