
const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator');

const User = require('../models/user');
const { error } = require('console');


const transport = nodemailer.createTransport(sendgridTransport({
    auth:{
        api_key:process.env.SENDGRID
    }
}));




exports.getLogin = (req, res , next ) => {

    let message = req.flash('error');
    console.log(message);
    console.log(message.length);

    if(message.length > 0){
        message = message[0];
    }
    else{
        message = null;
    }
    console.log(message);

    res.render('auth/login.ejs', {
        pageTitle:'Login Page',
        path: '/login',
        errorMessage: message,
        oldInput: { 
                email: '',
                password: '',
            },
            validationErrors: []
    });

};








exports.getSignup = (req, res , next ) => {
    let message = req.flash('error');
    console.log(message);
    console.log(message.length);

    if(message.length > 0){
        message = message[0];
    }
    else{
        message = null;
    }
    console.log(message);


    res.render('auth/signup.ejs', {
        pageTitle:'Signup Page',
        path: '/signup',
        errorMessage: message,
        oldInput: { 
                email: '',
                password: '',
                confirmPassword: ''
        },
        validationErrors: []
    });

};














exports.postLogin = (req, res , next ) => {
    const email = req.body.email;
    const password = req.body.password;

    const errors = validationResult(req);

    if(!errors.isEmpty()){
        console.log(errors.array())
        return res.status(422).render('auth/login.ejs', {
            pageTitle:'login Page',
            path: '/login',
            errorMessage: errors.array()[0].msg,
            oldInput: { 
                email: email,
                password: password,
            },
            validationErrors: errors.array()
        });
    }

    User.findOne({email: email})
        .then(user => {
            if(!user){                
                return res.status(422).render('auth/login.ejs', {
                    pageTitle:'login Page',
                    path: '/login',
                    errorMessage: 'invalid email or password',
                    oldInput: { 
                        email: email,
                        password: password,
                    },
                    validationErrors: [{path: 'email'}, {path: 'password'}]
                });
            }
                

            bcrypt.compare(password, user.password)
            .then(doMatch => {
                if(doMatch){
                            
                    req.session.isLoggedIn = true;
                    req.session.user = user;

                    // we should return this to avoid code excecution of line ( res.redirect('/login') ) which is under
                    // because the callback in save will excute asynchronously

                    // honestly i should understand the return and promises things in js
                    return req.session.save((err) => {
                        console.log(err);
                        res.redirect('/');
                    });
                }

                return res.status(422).render('auth/login.ejs', {
                    pageTitle:'login Page',
                    path: '/login',
                    errorMessage: 'invalid email or password',
                    oldInput: { 
                        email: email,
                        password: password,
                        confirmPassword:req.body.confirmPassword
                    },
                    validationErrors: [{path: 'email'}, {path: 'password'}]
                });
            })
            .catch(err => {
                console.log(err);
                res.redirect('/login');
            })

    })
    .catch( err => {
      //Well when we call next with an error passed as an argument, then we actually let express know that
      // an error occurred and it will skip all other middlewares and move right away to an error handling
      const error = new Error(err)
      error.httpStatusCode = 500;
      return next(error)
    });
};















exports.postSignup = (req, res , next ) => {
    //make sure you check your view, how these inputs are named because you retrieve the values on request body by these names,
    const email = req.body.email;
    const password = req.body.password;

    const errors = validationResult(req);

    if(!errors.isEmpty()){
        console.log(errors.array())
        return res.status(422).render('auth/signup.ejs', {
            pageTitle:'Signup Page',
            path: '/signup',
            errorMessage: errors.array()[0].msg,
            oldInput: { 
                email: email,
                password: password,
                confirmPassword:req.body.confirmPassword
            },
            validationErrors: errors.array()

        });
    }
    
    // this is an asynchronous task and therefore this gives us back a promise
    bcrypt.hash(password, 12)
    .then(hashedPassword => {    // here we have nestedpromiese for not having error if email already in database
        const user = new User({
            email: email,
            password: hashedPassword,
            cart: {items: []}
        });
        return user.save();
    })
    .then(result => {
        
        res.redirect('/login')
        return transport.sendMail({
            to: email,
            from: 'robo513adel@gmail.com', // i have to use the verified email in sendgrid حصرا
            subject: 'Signup done duuuuude!',
            html: '<h1>you truly are member of us now duddde</h1>'
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















exports.postLogout = (req, res , next ) => {

    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/');
    })
};









exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    console.log(message);
    console.log(message.length);

    if(message.length > 0){
        message = message[0];
    }
    else{
        message = null;
    }
    console.log(message);

    res.render('auth/reset.ejs', {
        pageTitle:'Reset Your password ',
        path: '/reset',
        errorMessage: message
    })

};












exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if(err){
            console.log(err);
            return res.redirect('/reset')
        }

        const token = buffer.toString('hex');

        User.findOne({email: req.body.email})
        .then(user => {
            if(!user){
                req.flash('error', 'No account with that email found');
                return res.redirect('/reset');
            }
            user.resetToken = token;
            user.resetTokenExpiration = Date.now() + 3600000;
            return user.save(); 

        })
        .then(result => {
            res.redirect('/')
            transport.sendMail({
                to: req.body.email,
                from: 'robo513adel@gmail.com', // i have to use the verified email in sendgrid حصرا
                subject: 'this email because you cant remmember your password duh!',
                html: `
                    <p>You Requested a password reset</p>
                    <p> Click here <a href="http://localhost:3000/reset/${token}">Link</a> to set a new Password</p>
                `
            });
        })
        .catch( err => {
            //Well when we call next with an error passed as an argument, then we actually let express know that
            // an error occurred and it will skip all other middlewares and move right away to an error handling
            const error = new Error(err)
            error.httpStatusCode = 500;
            return next(error)
        });
    });
};













exports.getNewPassword = (req, res, next) => {

    const token = req.params.token;
    User.findOne({ resetToken: token, resetTokenExpiration: {$gt: Date.now() } })
        .then(user => {

            let message = req.flash('error');
            console.log(message);
            console.log(message.length);

            if(message.length > 0){
                message = message[0];
            }
            else{
                message = null;
            }
            console.log(message);

            res.render('auth/new-password.ejs', {
                pageTitle:'New Password',
                path: '/new-password',
                errorMessage: message,
                userId: user._id.toString(),
                passwordToken: token
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












exports.postNewPassword = (req, res, next) => {

    const newPassword = req.body.password;
    const userId = req.body.userId;
    const token = req.body.passwordToken;

    let resetUser;

    User.findOne({ resetToken: token, resetTokenExpiration: {$gt: Date.now() }, _id:userId })
        .then(user => {
            resetUser = user;
            return bcrypt.hash(newPassword, 12);
        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save();
        })
        .then(result => {
            res.redirect('/login')
        })
        .catch( err => {
            //Well when we call next with an error passed as an argument, then we actually let express know that
            // an error occurred and it will skip all other middlewares and move right away to an error handling
            const error = new Error(err)
            error.httpStatusCode = 500;
            return next(error)
        });

};