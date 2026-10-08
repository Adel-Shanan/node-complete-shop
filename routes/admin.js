
const express = require('express');

const { check, body } = require('express-validator');


const adminController = require('../controllers/admin.js');
const adminValidators = require('../validators/admin.js');


const isAuth = require('../middleware/is-auth.js');
// isAuth can be added as an argument (its a handle) and the requests will be travel through the handlers from left to right

const router = express.Router();

// Implicitly, this route is reached under /admin/add-product for get reguests
router.get( '/add-product', isAuth, adminController.getAddProduct );



// Implicitly, this route is reached under /admin/add-product  for post requests
// we can repeat the path here ( /admin/add-product ) because we got different methods, get and post, so these will be two different
router.post('/add-product',adminValidators.addProductValidator,isAuth,adminController.postAddProduct );



router.get( '/products',isAuth, adminController.getProducts );



router.get( '/edit-product/:productId',isAuth, adminController.getEditProduct );



router.post('/edit-product',adminValidators.editProductValidator,isAuth,adminController.postEditProduct );



router.delete( '/product/:productId',isAuth, adminController.deleteProduct );

module.exports = router ; // or you can use ===> exports.routes = router;