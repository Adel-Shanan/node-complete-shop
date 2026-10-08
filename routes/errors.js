const express = require('express');

const router = express.Router();

const errorController = require('../controllers/errors.js');


router.use( '/500' , errorController.get500 );


router.use( '/' , errorController.get404 );




module.exports = router ;