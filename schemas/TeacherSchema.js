const mongoose = require("mongoose");

const teacherSchema = mongoose.Schema({
    userName: { 
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    hostId: {
        type: Number,
        required: true,
        unique: true
    },
    phone:{
        type: Number,
        required: true,
    },
    password: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Teacher', teacherSchema);