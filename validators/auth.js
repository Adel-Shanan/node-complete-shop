const { check, body } = require('express-validator');

const User = require('../models/user.js');

exports.loginValidator = [
    check('email')
    .isEmail()
    .withMessage('Please come on enter a valid email! ركز معلم')
    .normalizeEmail(),
    
    // notice here we show one message for 2 validators
    body('password', 'password contain only text and at least 5 characters')
    .trim()
    .isLength({ min: 5 })
    .isAlphanumeric()
];




exports.signupValidator = [
    check('email')
    .isEmail()
    .withMessage('Please come on enter a valid email!')
    .custom( ( value, { req } ) => {
        // this is just a refrence to practice
        /*if( value === 'forbidden@gmail.com' ){
            throw new Error('this email address is forbidden!!!!');
        }
        return true;*/

        return User.findOne({email: value})
            .then(userDoc => {
                if(userDoc){
                    console.log('email taken dummy');
                    return Promise.reject('email exist coooome onnn be creative!!! رحمني');
                    
                    //or
                    //throw new Error('Email exists');
                }
            });
    })
    .normalizeEmail(),

    // notice here we show one message for 2 validators
    body('password', 'password contain only text and at least 5 characters')
    .trim()
    .isLength({min: 5})
    .isAlphanumeric(),


    body('confirmPassword').trim().custom( (value, {req} ) => {
        console.log(value);
        console.log(req.body.password);
        console.log(value !== req.body.password);
        if( value !== req.body.password){
            throw new Error('Passwords have to match!!');
        }
        return true;
    })
];