const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    pid: {  
        type: Number,
        required: true,
        unique: true
    },
    userName: {  
        type: String,
    },
    email: {  
        type: String,
    },
    face_id: {  
        type: String,
    },
    disability: {  
        type: String,
        required: false,
    },
    phone: {
        type: Number,
    },
    password: {
        type: String,
    },
});

module.exports = mongoose.model('User', userSchema);
