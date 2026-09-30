const fs = require('fs');
const path = require('path');

const stripe = require('stripe')(process.env.STRIPE_KEY); // always keep this privte so only use it in node code

const PDFDocument = require('pdfkit');

const Product = require('../models/product.js');
const Order = require('../models/order.js');
const product = require('../models/product.js');
const { or } = require('sequelize');

const ITEMS_PER_PAGE = 1;


exports.getProducts = (req, res , next ) => {

 
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
  .countDocuments()
  .then(numProducts => {
    totalItems = numProducts;
    return product.find()
    .skip( (page - 1) * ITEMS_PER_PAGE )
    .limit(ITEMS_PER_PAGE);
  })
  .then( products => {

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
  })
  .catch( err => {
    //Well when we call next with an error passed as an argument, then we actually let express know that
    // an error occurred and it will skip all other middlewares and move right away to an error handling
    const error = new Error(err)
    error.httpStatusCode = 500;
    return next(error)
  });
  
};



















exports.getProduct = (req, res, next ) => {
  const prodId = req.params.productId;

  Product.findById(prodId)
  .then( product => {
    
    res.render('shop/product-details.ejs', {
      product: product,
      pageTitle: product.title + ' Details',
      path: '/products'
    });
  })
  .catch( err => {
    //Well when we call next with an error passed as an argument, then we actually let express know that
    // an error occurred and it will skip all other middlewares and move right away to an error handling
    const error = new Error(err)
    error.httpStatusCode = 500;
    return next(error)
  });

};
















exports.getIndex =  (req, res , next ) => {

  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
  .countDocuments()
  .then(numProducts => {
    totalItems = numProducts;
    return product.find()
    .skip( (page - 1) * ITEMS_PER_PAGE )
    .limit(ITEMS_PER_PAGE);
  })
  .then( products => {

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
  })
  .catch( err => {
    //Well when we call next with an error passed as an argument, then we actually let express know that
    // an error occurred and it will skip all other middlewares and move right away to an error handling
    const error = new Error(err)
    error.httpStatusCode = 500;
    return next(error)
  });
  
};


















exports.getCart = (req, res, next) => {
  req.user.populate('cart.items.productId')
  .then(user => {
    const products = user.cart.items;
    //console.log(products);
    res.render('shop/cart.ejs', {
      pageTitle:'Your Cart',
      path: '/cart',
      products: products
    });
  })
  .catch( err => {
    //Well when we call next with an error passed as an argument, then we actually let express know that
    // an error occurred and it will skip all other middlewares and move right away to an error handling
    const error = new Error(err)
    error.httpStatusCode = 500;
    return next(error)
  });

  // My approach by implementing my own method in the user model to load the cart 

  // req.user.getCart()
  // .then(products => {
  //   //console.log(products);
  //   res.render('shop/cart.ejs', {
  //     pageTitle:'Your Cart',
  //     path: '/cart',
  //     products: products
  //   });
  // })
  // .catch( err => {
  //  //Well when we call next with an error passed as an argument, then we actually let express know that
  //  // an error occurred and it will skip all other middlewares and move right away to an error handling
  //  const error = new Error(err)
  //  error.httpStatusCode = 500;
  //  return next(error)
  // });


};




















exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
         .then(product => {
            return req.user.addToCart(product);
         })
         .then(result => {
          console.log(result);
          res.redirect('/cart');
         })
         .catch( err => {
            //Well when we call next with an error passed as an argument, then we actually let express know that
            // an error occurred and it will skip all other middlewares and move right away to an error handling
            const error = new Error(err)
            error.httpStatusCode = 500;
            return next(error)
          });

};
















exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user.deleteFromCart(prodId)
    .then(result => {
      //console.log(result);
      res.redirect('/cart');
    })
    .catch( err => {
      //Well when we call next with an error passed as an argument, then we actually let express know that
      // an error occurred and it will skip all other middlewares and move right away to an error handling
      const error = new Error(err)
      error.httpStatusCode = 500;
      return next(error)
    });

};














exports.getCheckoutSuccess = (req, res, next) => {

  req.user.populate('cart.items.productId')
     .then(user => {
      const products = user.cart.items.map(i => {
        return ({ product: { ...i.productId }, quantity: i.quantity }); // here productId  is the name of the whole product data because we named it like that in the user model .. just to keep in mind 
      })
      return products;
     })
     .then(products =>{
      const order = new Order({ 
        user: {
          email: req.user.email,
          userId: req.user._id
        },
        items: products
      });

      return order.save();
     })
     .then(result => {
      req.user.cart = { items: [] };
      return req.user.save();
     })
     .then(result => {
      res.redirect('/orders');
     })
     .catch( err => {
        //Well when we call next with an error passed as an argument, then we actually let express know that
        // an error occurred and it will skip all other middlewares and move right away to an error handling
        const error = new Error(err)
        error.httpStatusCode = 500;
        return next(error)
      });
};






















// after video 357 we didnt use it , although we copu paste it and named it getCheckoutSuccess
exports.postOrder = (req, res, next) => {

  req.user.populate('cart.items.productId')
     .then(user => {
      const products = user.cart.items.map(i => {
        return ({ product: { ...i.productId }, quantity: i.quantity }); // here productId  is the name of the whole product data because we named it like that in the user model .. just to keep in mind 
      })
      return products;
     })
     .then(products =>{
      const order = new Order({ 
        user: {
          email: req.user.email,
          userId: req.user._id
        },
        items: products
      });

      return order.save();
     })
     .then(result => {
      req.user.cart = { items: [] };
      return req.user.save();
     })
     .then(result => {
      res.redirect('/orders');
     })
     .catch( err => {
        //Well when we call next with an error passed as an argument, then we actually let express know that
        // an error occurred and it will skip all other middlewares and move right away to an error handling
        const error = new Error(err)
        error.httpStatusCode = 500;
        return next(error)
      });
};

















exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      console.log(orders);
      res.render('shop/orders.ejs', {
        pageTitle:'Your Orders',
        path: '/orders',
        orders: orders
      });
    })
    .catch( err => {
      //Well when we call next with an error passed as an argument, then we actually let express know that
      // an error occurred and it will skip all other middlewares and move right away to an error handling
      const error = new Error(err)
      error.httpStatusCode = 500;
      return next(error)
    });

};














exports.getCheckout = (req, res, next) => {  
  let products;
  let total = 0;

  req.user.populate('cart.items.productId')
  .then(user => {

    products = user.cart.items;
    total = 0;

    products.forEach(p => {
      total += p.quantity * p.productId.price;
    });

    return stripe.checkout.sessions.create({
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

  })
  .then( session => {
    
      res.render('shop/checkout.ejs', {
        pageTitle:'Checkout',
        path: '/checkout',
        products: products,
        totalSum: total,
        sessionId: session.id,
        stripePublishableKey: process.env.STRIPE_PUBLISH_KEY
      });

  })
  .catch(err => {
      //Well when we call next with an error passed as an argument, then we actually let express know that
      // an error occurred and it will skip all other middlewares and move right away to an error handling
      console.log(err);
      const error = new Error(err)
      error.httpStatusCode = 500;
      return next(error)
  });
};










exports.getInvoice = (req, res, next) => {

  const orderId = req.params.orderId;
  
  Order.findById(orderId).then(order=>{
    if(!order){
      return next(new Error('No order Found'));
    }

    if(order.user.userId.toString() !== req.user._id.toString()){
      return next(new Error('unauthorized'));
    }

    const invoiceName = 'invoice-' + orderId + '.pdf';
    const invoicePath = path.join('data', 'invoices', invoiceName);

    
    // fs.readFile(invoicePath, (err, data) => {
    //   if (err) {
    //     return next(err);
    //   }

    //   console.log('send');
    //   res.setHeader('Content-Type', 'application/pdf');
    //   res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"')
    //   res.send(data);
    // });


    /* ⚠️
      The upper approach loads the entire file into memory before sending the response,
      which can be inefficient for large files. Instead, we'll use streaming to
      read and send the file in small chunks, reducing memory usage.
    */

      
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
 
  }).catch(err => next(err));

};