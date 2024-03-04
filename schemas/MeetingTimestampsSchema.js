const mongoose = require("mongoose");

// Define a sub-schema for the emotions
const emotionsSchema = mongoose.Schema({
    happy: Number,
    sad: Number,
    confused: Number,
    excited: Number
}, { _id : false });

const meetingTimestampsSchema = mongoose.Schema({
    meet_id:{
        type: Number,
    },
    report_no: {
        type: Number,
    },
    timeStamp: {
        type: String,
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

module.exports = mongoose.model('Meeting_Timestamps', meetingTimestampsSchema);
