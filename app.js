/////// triger deploy 

const path = require('path');
const fs = require('fs')
const https = require('https');
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');



const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const csrf = require('csurf');
const flash = require('connect-flash');

const multer = require('multer');

const User = require('./models/user.js');

const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');


const MONGODB_URI =  `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@nodecoursecluster.ifg3pyi.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority&appName=nodeCourseCluster`;


const app = express();

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  {flags: 'a'}
)

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "script-src": ["'self'", "https://js.stripe.com"],
        "frame-src": ["'self'", "https://js.stripe.com"],
      },
    },
  })
);
app.use(compression());
app.use(morgan('combined', {stream: accessLogStream}));



/*
(process.env.NODE_ENV)
this is a special environment variable even
though it's not set by default, expressjs will actually use that by default to determine
the environment mode and if you set that to production, expressjs will change certain things
and for example, it will reduce the details for errors it throws and in general, optimize some things for deployment.
and again hosting providers typically do that for you.*/

console.log(process.env.NODE_ENV);  // go to package.json to know what is that



const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});


const csrfProtection = csrf();

/*
const privateKey = fs.readFileSync('server.key');
const certificate = fs.readFileSync('server.cert');
*/

const imagesPath = path.join(__dirname, 'images');

if (!fs.existsSync(imagesPath)) {
    fs.mkdirSync(imagesPath);
}


const fileStorage = multer.diskStorage({
  destination: (req,file,cb) => {
    if (!fs.existsSync(imagesPath)) {
        fs.mkdirSync(imagesPath, { recursive: true });
    }
    cb(null,'images');
  },
  filename:(req,file,cb) => {
    cb(null, new Date().getTime() + '-' +file.originalname)
  } 
});

const fileFilter = (req,file,cb) => {

  if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'  )
    cb(null,true);
  else
    cb(null,false);
};


app.set('view engine', 'ejs');
app.set('views', 'views');


const adminRoutes = require('./routes/admin.js');
const shopRoutes = require('./routes/shop.js');
const authRoutes = require('./routes/auth.js');
const errorRoutes = require('./routes/errors.js');



// order does matter for the use methodes


app.use(bodyParser.urlencoded({extended: false}));
app.use(multer({storage:fileStorage, fileFilter: fileFilter }).single('image'))

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images',express.static(path.join(__dirname, 'images')));


app.use(session({secret: 'my secret', resave: false, saveUninitialized: false, store: store}))
// secret: in production must be loong string value


app.use(csrfProtection);
app.use(flash());





app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
})









// retrieving the user from the session
app.use((req, res, next) =>{
  // ⚠️ having such an error here ( into synchronous code ) which means inside normal function can simply lead to the general error middleware so no problem
  // basically to test it you can use ( throw new Error('') ) here 

  if( !req.session.user ){
    return next();
  }
  User.findById(req.session.user._id)
      .then(user => {
        // ⚠️ having such an error here ( into asynchronous code ) which means inside then-catch can NOT lead to the general error middleware 
        // here we get through the catch block but if in the catch block we are using (throw error) thats the problem
        // to solve it we use ( next with an error included ) inside the catch block  ( go there and read )


        // we added this if block in error handling video 310
        //because even if we make it to here maybe for some reason, we might still not find that user even if we have it stored in a session,
        //maybe because the user was deleted in a database in-between.
        
        if(!user){
          return next();
        }
        
        //So just that we are super safe that we don't store some undefined object in the user object.
        req.user = user;
        next();
      })
      .catch(err => {
        // ⚠️ instead of jst console.log(err) we throw the error ( video 310 ) ⚠️  then we discovered its not the best solution (video 314)
        
        // ⚠️ important ⚠️
        // throwing an error here does not lead to our general error handling middleware (down there)
        // because we are inside some async code (than-catch / promise )
        // instead we use ( next with an error included ) like that :

        next(new Error(err));

      });
})











//Now only routes starting with  /admin  will go into the admin routes file
app.use('/admin' , adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorRoutes);






//Now express is clever enough to detect that this is a special kind of middleware and it will move (((( directlyyyyyy )))
// to these error handling middlewares when you call next with an error passed to it
app.use((error, req, res, next) => {

  // res.status(error.httpStatusCode).render(...);    orrr use this:

  //res.redirect('/500'); this is not good resaon :

  // ⚠️ If an error occurs while retrieving the user from the session, redirecting to /500 creates a new request,
  // which runs this middleware again and may cause an infinite loop.
  // The error above in the retrieving session middleware could come from the DB/session.
  
  // Solution: render the error page directly instead of redirecting:

  // note: in this solution csrf middleware should be above the retrieving session middleware
  
  res.status(500).render('500.ejs', {
    pageTitle:'Error Page',
    path: '/500',
    isAuthenticated: req.session.isLoggedIn

  });
});









mongoose
  .connect(MONGODB_URI)
  .then(result => {

    // this if you wanted to configure an ssl manually on our own but when depoly the host provider manage ssl will do that for us
          /* https.createServer({key: privateKey, cert: certificate}, app)
           .listen(process.env.PORT || 3000 , () => {
             console.log('Server running at http://localhost:3000');

           });
          */


    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.log(err);
  });
