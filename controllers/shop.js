const fs = require('fs');
const path = require('path');

const stripe = require('stripe')(process.env.STRIPE_KEY); // always keep this privte so only use it in node code

const PDFDocument = require('pdfkit');

const Product = require('../models/product.js');
const Order = require('../models/order.js');

const ITEMS_PER_PAGE = 1;


exports.getProducts = async (req, res , next ) => {


 
  const page = +req.query.page || 1;
  let totalItems;

  try {

    const numProducts = await Product.find().countDocuments();

    totalItems = numProducts;

    const products = await Product.find().skip( (page - 1) * ITEMS_PER_PAGE ).limit(ITEMS_PER_PAGE);

    res.render('shop/products-list.ejs', {
      prods: products,
      pageTitle:'All Products',
      path: '/products',
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
    });
    
  }

  catch( err ) {
    //Well when we call next with an error passed as an argument, then we actually let express know that
    // an error occurred and it will skip all other middlewares and move right away to an error handling
    const error = new Error(err)
    error.httpStatusCode = 500;
    return next(error)
  }
  
};



















exports.getProduct = async (req, res, next ) => {
  const prodId = req.params.productId;

  try {
    const product = await Product.findById(prodId);
    
    res.render('shop/product-details.ejs', {
      product: product,
      pageTitle: product.title + ' Details',
      path: '/products'
    });
  }

  catch( err ) {
    //Well when we call next with an error passed as an argument, then we actually let express know that
    // an error occurred and it will skip all other middlewares and move right away to an error handling
    const error = new Error(err)
    error.httpStatusCode = 500;
    return next(error)
  }

};
















exports.getIndex =  async (req, res , next ) => {

  const page = +req.query.page || 1;
  let totalItems;

  try { 
    const numProducts = await Product.find().countDocuments();

    totalItems = numProducts;

    const products = await Product.find().skip( (page - 1) * ITEMS_PER_PAGE ).limit(ITEMS_PER_PAGE);
 
    res.render('shop/index.ejs', {
      prods: products,
      pageTitle:'Shop',
      path: '/',
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
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


















exports.getCart = async (req, res, next) => {

  try {
    const user = await req.user.populate('cart.items.productId');
    
    const products = user.cart.items;
    //console.log(products);
    res.render('shop/cart.ejs', {
      pageTitle:'Your Cart',
      path: '/cart',
      products: products
    });
  }
  catch( err ) {
    //Well when we call next with an error passed as an argument, then we actually let express know that
    // an error occurred and it will skip all other middlewares and move right away to an error handling
    const error = new Error(err)
    error.httpStatusCode = 500;
    return next(error)
  };

  // My approach by implementing my own method in the user model to load the cart 

  // try { 
  // const products = await req.user.getCart();

  //   res.render('shop/cart.ejs', {
  //     pageTitle:'Your Cart',
  //     path: '/cart',
  //     products: products
  //   });
  // }

  //  catch( err ) {
  //  //Well when we call next with an error passed as an argument, then we actually let express know that
  //  // an error occurred and it will skip all other middlewares and move right away to an error handling
  //  const error = new Error(err)
  //  error.httpStatusCode = 500;
  //  return next(error)
  // };


};




















exports.postCart = async (req, res, next) => {
  const prodId = req.body.productId;

  try { 
    const product = await Product.findById(prodId);
    
    const result = await req.user.addToCart(product);

    console.log(result);
    res.redirect('/cart');
  }
  catch( err )  {
    //Well when we call next with an error passed as an argument, then we actually let express know that
    // an error occurred and it will skip all other middlewares and move right away to an error handling
    const error = new Error(err)
    error.httpStatusCode = 500;
    return next(error)
  };

};
















exports.postCartDeleteProduct = async (req, res, next) => {

  const prodId = req.body.productId;

  try {
    const result = await req.user.deleteFromCart(prodId);
  
    //console.log(result);
    res.redirect('/cart');
  }
  catch( err ) {
    //Well when we call next with an error passed as an argument, then we actually let express know that
    // an error occurred and it will skip all other middlewares and move right away to an error handling
    const error = new Error(err)
    error.httpStatusCode = 500;
    return next(error)
  };

};














exports.getCheckoutSuccess = async (req, res, next) => {

  try { 
    const user = await req.user.populate('cart.items.productId');

    const products = user.cart.items.map(i => {
      return ({ product: { ...i.productId }, quantity: i.quantity }); // here productId  is the name of the whole product data because we named it like that in the user model .. just to keep in mind 
    })
      
    const order = new Order({ 
      user: {
        email: req.user.email,
        userId: req.user._id
      },
      items: products
    });

    const result = await order.save();
  
    req.user.cart = { items: [] };
    const result2 = await req.user.save();
    
    res.redirect('/orders');
  }
  catch( err )  {
    //Well when we call next with an error passed as an argument, then we actually let express know that
    // an error occurred and it will skip all other middlewares and move right away to an error handling
    const error = new Error(err)
    error.httpStatusCode = 500;
    return next(error)
  };
};






















// after video 357 we didnt use it , although we copu paste it and named it getCheckoutSuccess
exports.postOrder = async (req, res, next) => {

  try { 
    const user = await req.user.populate('cart.items.productId');

    const products = user.cart.items.map(i => {
        return ({ product: { ...i.productId }, quantity: i.quantity }); // here productId  is the name of the whole product data because we named it like that in the user model .. just to keep in mind 
      })

    const order = new Order({ 
      user: {
        email: req.user.email,
        userId: req.user._id
      },
      items: products
    });

    const result = await order.save();
  
    req.user.cart = { items: [] };
    const result2 = await req.user.save();
  
    res.redirect('/orders');
  }
  catch( err ) {
    //Well when we call next with an error passed as an argument, then we actually let express know that
    // an error occurred and it will skip all other middlewares and move right away to an error handling
    const error = new Error(err)
    error.httpStatusCode = 500;
    return next(error)
  }
};

















exports.getOrders = async (req, res, next) => {

  try { 

    const orders = await Order.find({ 'user.userId': req.user._id });
  
    console.log(orders);
    res.render('shop/orders.ejs', {
      pageTitle:'Your Orders',
      path: '/orders',
      orders: orders
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














exports.getCheckout = async (req, res, next) => {  
  let products;
  let total = 0;

  try { 

    const user = await req.user.populate('cart.items.productId');

    products = user.cart.items;
    total = 0;

    products.forEach(p => {
      total += p.quantity * p.productId.price;
    });

    const session = await stripe.checkout.sessions.create({

      payment_method_types: ['card'],
      mode: 'payment',
      line_items: products.map(p => {
        return {

          price_data:{
            
            product_data: {
              name: p.productId.title,
              description: p.productId.description
            },

            currency: 'usd',

            unit_amount:p.productId.price * 100

          },

          quantity: p.quantity
        };

      }),

      /*            NOTE VIDEO 357
      Relying only on `success_url` is insecure since users can access it without paying.
      For production, use Stripe **Webhooks** to verify successful payments; on localhost, manual verification via the Stripe Dashboard is sufficient.
      */
      success_url: req.protocol + '://' + req.get('host') + '/checkout/success', // => http://localhost:3000
      cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
    });

    res.render('shop/checkout.ejs', {
      pageTitle:'Checkout',
      path: '/checkout',
      products: products,
      totalSum: total,
      sessionId: session.id,
      stripePublishableKey: process.env.STRIPE_PUBLISH_KEY
    });

  }
  catch(err )  {
      //Well when we call next with an error passed as an argument, then we actually let express know that
      // an error occurred and it will skip all other middlewares and move right away to an error handling
      console.log(err);
      const error = new Error(err)
      error.httpStatusCode = 500;
      return next(error)
  };
};










exports.getInvoice = async (req, res, next) => {

  const orderId = req.params.orderId;
  
  try { 
    const order = await Order.findById(orderId);
    
    if(!order){
      return next(new Error('No order Found'));
    }

    if(order.user.userId.toString() !== req.user._id.toString()){
      return next(new Error('unauthorized'));
    }

    const invoiceName = 'invoice-' + orderId + '.pdf';
    const invoicePath = path.join('data', 'invoices', invoiceName);
    
    const pdfDoc = new PDFDocument(); // its a readable stream

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"')

    pdfDoc.pipe(fs.createWriteStream(invoicePath)); // this ensure that the pdf we generate also gets stored on the server and not just serve to the client
    pdfDoc.pipe(res);
    
    pdfDoc.fontSize(26).text('Invoice', { underline: true} );
    pdfDoc.text('---------------------------');
    

    let totalprice=0;

    order.items.forEach(prod => {
      totalprice += prod.quantity * prod.product.price;
      pdfDoc.fontSize(14).text(prod.product.title + ' - ' + prod.quantity + ' x ' + '$' + prod.product.price);
    })

    pdfDoc.fontSize(26).text('---------------------------');
    pdfDoc.fontSize(26).text('total price: $' + totalprice);

    pdfDoc.end();

    /* these two lines are not neccesry after using pdfkit to generate the pdf */
    //const file = fs.createReadStream(invoicePath); // with that node will be able to read in the file step by step in different chunks
    //file.pipe(res); // not every object is a writable stream but (res) happens to be one 
 
  }
  catch (err) {
     next(err)
  }

};