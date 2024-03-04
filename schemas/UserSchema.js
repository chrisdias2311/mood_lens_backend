const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowecase: true,
      trim: true,
    },
    coverImage: {
      type: String, // cloudinary || firebase url
    },
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    jwtToken: {
      type: String
    }

  },
  { timestamps: true }
)

//pre hooks
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();

})

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);

}

userSchema.methods.generateToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username

    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.TOKEN_EXPIRY }
  )
}


const User = mongoose.model("User", userSchema);
module.exports = User;