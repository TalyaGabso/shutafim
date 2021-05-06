const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
   firstName: {
      type: String,
      required: true,
      unique: false,
      trim: true
   },
   lastName: {
      type: String,
      required: true,
      unique: false,
      trim: true
   },
   email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
         if (!validator.isEmail(value)) {
            throw new Error('Email is invalid');
         };
      },
   },
   password: {
      type: String,
      required: true,
      minlength: 7,
      trim: true,
      validate(value) {
         if (value.toLowerCase().includes('password')) {
            throw new Error('Password cannot contain "password"')
         }
      }
   },
   //HAIR:taxture type
   //PERSONAL INFO:
   // phone number
   // address: country, state, zip, city, address ,apt
   tokens: [{
      token: {
         type: String,
         required: true,
      },
   }]
});
// method for hiding private data:
userSchema.methods.toJSON = function () {
   const user = this;
   const userObject = user.toObject();

   delete userObject.password;
   delete userObject.tokens;

   return userObject;
};


// create an authentication token with login
userSchema.methods.generateAuthToken = async function () {
   const user = this;
   const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
   user.tokens = user.tokens.concat({ token });
   await user.save();

   return token;
};

// login with email and password
userSchema.static.findByCredentials = async (email, password) => {
   //find email 
   const user = await User.findOne({ email });
   if (!user) {
      throw new Error('Unble to login, please make sure you entered  the correct email and/or password');
   };

   //check if password match 
   const isMatch = await bcrypt.compare(password, user.password)
   if (!isMatch) {
      throw new Error('Unble to login, please make sure you entered  the correct email and/or password');
   };

   return user;
};

// Hash the password before saving
userSchema.pre('save', async function (next) {
   const user = this
   if (user.isModified('password')) {
      user.password = await bcrypt.hash(user.password, 8)
   };
   next();
});

const User = mongoose.model('User', userSchema)

module.exports = User