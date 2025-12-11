const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// --- FIX STARTS HERE ---
// 1. Remove 'next' from the parameters
userSchema.pre("save", async function () {
  const user = this;

  // 2. If password isn't modified, simply return (the Promise resolves automatically)
  if (!user.isModified("password")) {
    return;
  }

  // 3. No try/catch needed for 'next'. If this fails, the Promise rejects
  // and Mongoose passes the error to the controller automatically.
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(user.password, salt);
  user.password = hash;

  // 4. Do NOT call next(). The function ending signifies success.
});
// --- FIX ENDS HERE ---

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
