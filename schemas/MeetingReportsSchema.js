// const mongoose = require("mongoose");

// // Define a sub-schema for the emotions
// const emotionsSchema = mongoose.Schema({
//     happy: Number,
//     sad: Number,
//     confused: Number,
//     excited: Number
// }, { _id : false });

// const meetingReportsSchema = mongoose.Schema({
//     meet_id:{
//         type: Number,
//     },
//     host_id: {
//         type: Number,
//     },
//     text_emotions: {
//         type: [emotionsSchema], // Use the emotions sub-schema
//     },
//     video_emotions: {
//         type: [emotionsSchema], // Use the emotions sub-schema
//     },
//     audio_emotions: {
//         type: [emotionsSchema], // Use the emotions sub-schema
//     }
// });

// module.exports = mongoose.model('Meet_Report', meetingReportsSchema);


const mongoose = require("mongoose");

// Define a sub-schema for the emotions
const emotionsSchema = mongoose.Schema({
    happy: Number,
    surprised: Number,
    confused: Number,
    bored: Number,
    pnf: Number,     //pnf = person not found
}, { _id : false });

const meetingReportsSchema = mongoose.Schema({
    meet_id:{
        type: Number,
    },
    host_id: {
        type: Number,
    },
    title: {
        type: String,
    },
    description: {
        type: String,
    },
    startTime: {
        type: String,
    },
    endTime:{
        type: String,
    },
    host_name:{
        type: String,
    },
    text_emotions: {
        type: [emotionsSchema], // Use the emotions sub-schema
        default: [{ happy: 0, surprised: 0, confused: 0, bored: 0, pnf: 0 }] // Default to an empty array
    },
    video_emotions: {
        type: [emotionsSchema], // Use the emotions sub-schema
        default: [{ happy: 0, surprised: 0, confused: 0, bored: 0, pnf: 0 }] // Default to an empty array
    },
    audio_emotions: {
        type: [emotionsSchema], // Use the emotions sub-schema
        default: [{ happy: 0, surprised: 0, confused: 0, bored: 0, pnf: 0 }] // Default to an empty array
    }
});

module.exports = mongoose.model('Meet_Report', meetingReportsSchema);
