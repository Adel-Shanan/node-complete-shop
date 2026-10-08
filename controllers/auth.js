
const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator');

const User = require('../models/user');


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














exports.postLogin = async (req, res , next ) => {
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

    try {
        const user = await User.findOne({email: email});
    
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
            

        const doMatch = await bcrypt.compare(password, user.password);
        
        if(!doMatch){
                    
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

        }
    
        req.session.isLoggedIn = true;
        req.session.user = user;

    
        return req.session.save( err => {
            if(err) {
                console.log(err);
                return next(err);
            }

            return res.redirect('/');            
        });

        
    }
    catch ( err ) {
      //Well when we call next with an error passed as an argument, then we actually let express know that
      // an error occurred and it will skip all other middlewares and move right away to an error handling
      const error = new Error(err)
      error.httpStatusCode = 500;
      return next(error)
    };
};















exports.postSignup = async (req, res , next ) => {

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
    
    try { 

        // this is an asynchronous task and therefore this gives us back a promise
        const hashedPassword = await bcrypt.hash(password, 12);

        const user = new User({
            email: email,
            password: hashedPassword,
            cart: {items: []}
        });
        const result = await user.save();
    
        
        await transport.sendMail({
            to: email,
            from: 'robo513adel@gmail.com', // i have to use the verified email in sendgrid حصرا
            subject: 'Signup done duuuuude!',
            html: '<h1>you truly are member of us now duddde</h1>'
        });

        return res.redirect('/login');
    }
    catch( err )  {
      //Well when we call next with an error passed as an argument, then we actually let express know that
      // an error occurred and it will skip all other middlewares and move right away to an error handling
      const error = new Error(err)
      error.httpStatusCode = 500;
      return next(error)
    };

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












exports.postReset = async (req, res, next) => {

    crypto.randomBytes(32, async (err, buffer) => {
        if(err){
            console.log(err);
            return res.redirect('/reset')
        }

        const token = buffer.toString('hex');

        try { 
            const user = await User.findOne({email: req.body.email});
            
            if(!user){
                req.flash('error', 'No account with that email found');
                return res.redirect('/reset');
            }
            user.resetToken = token;
            user.resetTokenExpiration = Date.now() + 3600000;
            const result = await user.save(); 

            const result2 = await transport.sendMail({
                to: req.body.email,
                from: 'robo513adel@gmail.com', // i have to use the verified email in sendgrid حصرا
                subject: 'this email because you cant remmember your password duh!',
                html: `
                    <p>You Requested a password reset</p>
                    <p> Click here <a href="http://localhost:3000/reset/${token}">Link</a> to set a new Password</p>
                `
            });
            
            res.redirect('/')
        }
        catch( err ) {
            //Well when we call next with an error passed as an argument, then we actually let express know that
            // an error occurred and it will skip all other middlewares and move right away to an error handling
            const error = new Error(err)
            error.httpStatusCode = 500;
            return next(error)
        };
    });
};













exports.getNewPassword = async (req, res, next) => {

    try { 

        const token = req.params.token;
    
        const user = await User.findOne({ resetToken: token, resetTokenExpiration: {$gt: Date.now() } })

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
    }

    catch( err ) {
        //Well when we call next with an error passed as an argument, then we actually let express know that
        // an error occurred and it will skip all other middlewares and move right away to an error handling
        const error = new Error(err)
        error.httpStatusCode = 500;
        return next(error)
    };

};












exports.postNewPassword = async (req, res, next) => {

    const newPassword = req.body.password;
    const userId = req.body.userId;
    const token = req.body.passwordToken;

    let resetUser;

    try { 
        
        const user = await User.findOne({ resetToken: token, resetTokenExpiration: {$gt: Date.now() }, _id:userId })
        
        resetUser = user;
        
        const  hashedPassword = await bcrypt.hash(newPassword, 12);
            
        resetUser.password = hashedPassword;
        resetUser.resetToken = undefined;
        resetUser.resetTokenExpiration = undefined;
        const result = await resetUser.save();
    
        res.redirect('/login')
        
    }
    catch( err ) {
        //Well when we call next with an error passed as an argument, then we actually let express know that
        // an error occurred and it will skip all other middlewares and move right away to an error handling
        const error = new Error(err)
        error.httpStatusCode = 500;
        return next(error)
    };

};