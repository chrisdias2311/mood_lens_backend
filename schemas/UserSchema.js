const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    pid: {
        type: Number,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    disability: {
        type: String,
        required: false,
    }
});

module.exports = mongoose.model('User', userSchema);
