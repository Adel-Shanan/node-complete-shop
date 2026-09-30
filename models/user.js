const mongoose = require('mongoose');
const Product = require('./product');

const Schema = mongoose.Schema;

const userSchema = new Schema({
   
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },

    resetToken: String,

    resetTokenExpiration: Date,

    cart:{
        items: [{ productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true }, quantity: { type: Number, required:true } }]
    }

});


userSchema.methods.addToCart = function (product) {

    const cartProductIndex = this.cart.items.findIndex(cp => {        
        // console.log( cp.productId === product._id ) this cant help ( will return false even if the values are the same )
        return cp.productId.equals(product._id);
        // or we can use this --> return cp.productId.toString() === product._id.toString()
    });
    
    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];

    if(cartProductIndex >= 0){
        newQuantity = this.cart.items[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQuantity;
    }
    else{
        updatedCartItems.push({ productId: product._id, quantity: newQuantity })
    }
    const updatedCart = { items: updatedCartItems };
    this.cart = updatedCart;

    return this.save();
};


// max didnt wrote this at thie course  he used different approach at video 223
// userSchema.methods.getCart = function () {

//         const productIds = [];
//         const quantities = {};  // we can use map here instead of this type of objects { id -> quantity }    
//         this.cart.items.forEach( ele => {
//             let prodId = ele.productId;
//             const key = prodId.toString();  // search what this is for 

    
//             productIds.push(prodId);
//             quantities[key] = ele.quantity;
//         });
    
//         return Product.find({ _id: { $in: productIds } })
//             .then((products) => {
//                 return products.map((p) => {
//                     return { ...p, quantity: quantities[p._id] };
//                 });
//             })
//             .catch(err => console.log(err) );

//     };


userSchema.methods.deleteFromCart =  function (prodId) {
        // Maximilian wrote this method with another approache if you want to take a look at video ..#224

        const cartProductIndex = this.cart.items.findIndex(cp => {
            return cp.productId.equals(prodId);
        });

        if(cartProductIndex >= 0 ){
            const updatedCartItems = [...this.cart.items];
            updatedCartItems.splice(cartProductIndex, 1);

            const updatedCart = { items: updatedCartItems };

            this.cart = updatedCart;
        }

        return this.save();

    }



module.exports = mongoose.model('User', userSchema);
