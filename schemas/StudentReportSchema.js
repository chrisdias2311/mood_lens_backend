const mongoose = require("mongoose");

// Define a sub-schema for the emotions
const emotionsSchema = mongoose.Schema({
    happy: Number,
    sad: Number,
    confused: Number,
    excited: Number
}, { _id : false });

const studentReportSchema = mongoose.Schema({
    student_id:{
        type: Number,
    },
    meet_id: {
        type: Number,
    },
    text_emotions: {
        type: [emotionsSchema], // Use the emotions sub-schema
    },
    video_emotions: {
        type: [emotionsSchema], // Use the emotions sub-schema
    },
    audio_emotions: {
        type: [emotionsSchema], // Use the emotions sub-schema
    }
});

module.exports = mongoose.model('Student_Report', studentReportSchema);
