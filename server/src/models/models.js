// models/userModel.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100,
  },
  password: {
    type: String,
    required: true,
    select: false,
    validate: {
      validator: (value) => {
        return value.length > 7;
      },
      message: "Please enter a longer password. At least 8 characters.",
    },
  },
  usertype: {
    type: String,
    enum: ['admin', 'operator', 'user'],
    default: 'user',
  },
  tokenVersion: { type: Number, default: 0, min: 0 },
});

// Define o modelo User
const User = mongoose.model("User", userSchema);

module.exports = User;


