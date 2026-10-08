const Product = require('../models/product.js');

const cloudinary = require('../util/cloudinary');


const { validationResult } = require('express-validator');


exports.getAddProduct = (req, res , next ) => {

  // no need to be views/edit-product.ejs ... we did refer to the views folder in app.js  ===> app.set('views', 'views');
  res.render('admin/edit-product.ejs', {
    pageTitle:'Add a product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });

};







exports.postAddProduct =  async (req, res , next ) => {
  
  //console.log(req.body);

  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  const errors = validationResult(req);

  console.log(image);

  if(!image){
    return res.status(422).render('admin/edit-product.ejs', {
      pageTitle:'Add a product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: 'attached file is not an image',
      validationErrors: []

    });
  }

  if(!errors.isEmpty() ){
     return res.status(422).render('admin/edit-product.ejs', {
      pageTitle:'Add a product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()

    });
  }

  console.log('here i am');

  const imageUrl = image.path;  

  
  const product = new Product(
    {
      title: title,
      price: price,
      description: description,
      imageUrl:imageUrl,
      imagePublicId: image.filename,
      userId: req.user._id
  });

  console.log(product);

  try{

    const result = await product.save();

    //console.log('well....', result);
    console.log('Product got created');
    res.redirect('/admin/products');

  }
  catch( err ) {
    const error = new Error(err)
    error.httpStatusCode = 500;
    return next(error)
  };

};












exports.getEditProduct = async (req, res , next ) => {

  const editMode = req.query.edit;
  //console.log(editMode);
  //console.log(typeof(editMode));

  if( !( editMode ==='true' ) ){
    return res.redirect('/');
  }

  const prodId = req.params.productId;

  try {
    
    const product = await Product.findById(prodId);
  
    if(!product){
      return res.redirect('/');
    }

    res.render('admin/edit-product.ejs', {
      pageTitle:'Edit a product',
      path: '/admin/edit-product',
      editing: editMode,
      product: product,
      hasError:false,
      errorMessage: null,
      validationErrors: []


    });
  }
  catch( err ){
    //Well when we call next with an error passed as an argument, then we actually let express know that
    // an error occurred and it will skip all other middlewares and move right away to an error handling
    const error = new Error(err)
    error.httpStatusCode = 500;
    return next(error)
  }

};










exports.postEditProduct = async (req, res, next) => {
  
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedImage = req.file; // note this
  const updatedPrice = req.body.price;
  const updatedDescription = req.body.description;

  const errors = validationResult(req);

  console.log(updatedImage);

  if(!errors.isEmpty() ){
    return res.status(422).render('admin/edit-product.ejs', {
      pageTitle:'Edit a product',
      path: '/admin/edit-product',
      editing: true,
      hasError: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDescription,
        _id: prodId
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()

    });
  }

  try {
    const product = await Product.findById(prodId);
  
    if (!product) {
      return next(new Error('Product not found!'));
    }

    // to ensure that only the same user who added the product can make post edit to the product
    if (product.userId.toString() !== req.user._id.toString()) {
      return res.redirect('/');
    }

    product.title = updatedTitle;
    product.price = updatedPrice;
    product.description = updatedDescription;

    // if no new image was passed or the new uploaded file was not image we simply dont set it on the object
    if (updatedImage) {
      const result = await cloudinary.uploader.destroy(product.imagePublicId);
        
      product.imageUrl = updatedImage.path;
      product.imagePublicId = updatedImage.filename;

    }

    const result = await product.save();
                    
    //console.log(result);
    res.redirect('/admin/products');
  
  }
    catch( err ) {
      //Well when we call next with an error passed as an argument, then we actually let express know that
      // an error occurred and it will skip all other middlewares and move right away to an error handling
      const error = new Error(err)
      error.httpStatusCode = 500;
      return next(error)
    }
};











exports.postDeleteProduct = async (req, res, next) => {

  const prodId = req.body.productId;
  
  // this for deleting the image of the product ( added on video 334 )
  
  try {
    const product = await Product.findById(prodId);

    if(!product){
      return next(new Error('Product not found!'));
    }


    const result = await cloudinary.uploader.destroy(product.imagePublicId);
  
    const deleting_result = await Product.deleteOne({_id: prodId, userId: req.user._id}); // deleting product from the shop

    const deleting_from_cart_result = await req.user.deleteFromCart(prodId);  // deleting product from the cart if existed
  
    console.log('Product got destroyed... from the Controller');

    res.redirect('/admin/products');
  }
  catch( err ) {
    //Well when we call next with an error passed as an argument, then we actually let express know that
    // an error occurred and it will skip all other middlewares and move right away to an error handling
    const error = new Error(err)
    error.httpStatusCode = 500;
    return next(error)
  }

};








exports.deleteProduct = async (req, res, next ) => {

  const prodId = req.params.productId;
  
  try {

    // this for deleting the image of the product ( added on video 334 )

    const product = await Product.findById(prodId);
  
    if(!product){
      return next(new Error('Product not found!'));
    }
    

    const result = await cloudinary.uploader.destroy(product.imagePublicId);
  
    const deleting_result = await Product.deleteOne({_id: prodId, userId: req.user._id}); // deleting product from the shop

    const deleting_from_cart_result = await req.user.deleteFromCart(prodId);  // deleting product from the cart if existed
  
    console.log('Product got destroyed... from the Controller');
    res.status(200).json({message: 'Success'});
    
  }
  catch( err ) {
    res.status(500).json({message: 'deleting product failed'});
  };

};
































exports.getProducts = async (req, res , next ) => {
  

  try {

  // we added restriction {userId: req.user._id} so that only users who created the product can edit or delete it 

  const products = await Product.find({userId: req.user._id}); /* .select('title price -_id').populate('userId', 'name'); */ // populate and select got mentioned in video 221
    //console.log(products);
    res.render('admin/products.ejs', {
      prods: products,
      pageTitle:'Admin Products',
      path: '/admin/products'
    });

  }
  catch( err ) {
      //Well when we call next with an error passed as an argument, then we actually let express know that
      // an error occurred and it will skip all other middlewares and move right away to an error handling
      const error = new Error(err)
      error.httpStatusCode = 500;
      return next(error)
    };
  
};