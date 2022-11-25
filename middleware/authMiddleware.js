const jwt = require('jsonwebtoken');
const User=require('../models/User');

const requireAuth = (req, res, next) => {
  const cook = req.cookies;
  const token=cook.jwt;
  console.log('token is :',token);
  // check json web token exists & is verified
  if (token!=undefined) {
    jwt.verify(token,process.env.secret, (err, decodedToken) => {
      if (err) {
        console.log('err is :',err.message);
        res.redirect('/login');
      } else {
        console.log('token is :',decodedToken);
        next();
      }
    });
  } else {
    res.redirect('/login');
  }
};


// check currernt user
const checkUser = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token,process.env.secret, async (err, decodedToken) => {
      if (err) {
        res.locals.user = null;
        next();
      } else {
        let user = await User.findById(decodedToken.id);
        res.locals.user= user;
        next();
      }
    });
  } else {
    res.locals.user= null;
    next();
  }
};


module.exports = { requireAuth , checkUser};