const { check, body } = require('express-validator');

exports.addProductValidator = [

    body('title').isString().isLength({min:3}).trim(),
    body('price').isFloat(),
    body('description').isLength({min:5, max:400}).trim()
    
];


exports.editProductValidator = [
    body('title').isString().isLength({min:3}).trim(),
    body('price').isFloat(),
    body('description').isLength({min:5, max:400}).trim()
    
]