const mongoose = require("mongoose");

// Define a sub-schema for the emotions
const emotionsSchema = mongoose.Schema({
    happy: Number,
    surprised: Number,
    confused: Number,
    bored: Number,
    pnf: Number,     //pnf = person not found
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
    modeType: {
        type: String,
    },
    emotions: {
        type: [emotionsSchema], // Use the emotions sub-schema
        default: [{ happy: 0, surprised: 0, confused: 0, bored: 0, pnf: 0 }] // Default to an empty array
    }
});

module.exports = mongoose.model('Meeting_Timestamps', meetingTimestampsSchema);
