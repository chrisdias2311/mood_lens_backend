const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();
const axios = require("axios");
const fs = require("fs");
const sharp = require("sharp");
const https = require("https");

const MeetingReport = require("../schemas/MeetingReportsSchema");
const MeetingTimestamps = require("../schemas/MeetingTimestampsSchema");
const StudentReport = require("../schemas/StudentReportSchema");


const genAI = new GoogleGenerativeAI("AIzaSyAGbRvDFK9HwhytwYY9613KTZTfh94GWWo");

async function textToEmotion(studentPID, message) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Analyze the following message and identify the student's most likely emotion: ${message} (Choose from: Surprised, Confused, Happy, Bored).
    
    If any of these scenarios occur with student {Answer correct,
        Enjoy lesson,
        Understand concept,
        Work with peers,
        Feel supported,
        Control learning,
        Celebrate success,
        Connect with friends,
        Learn at own pace,
        Tech works well,
        Prefer online learning} the student is happy.
    
    If any of these scenarios happen {Unexpected announcement
        Guest speaker joins
        Technical glitch occurs
        Teacher makes a joke
        Learn something new
        See classmate online
        Win a game or contest
        Break from routine
        Teacher gives praise
        Unexpected question} the student is surprised.

    If any of these scenarios occur {Miss key instruction
        Technical issues arise
        Unclear explanation
        Fast lecture pace
        New vocabulary used
        Complex concept introduced
        Forget key information
        Hear unclear audio
        Lack practice opportunity
        Miss classmate explanation} the student is confused.
    
    If any of these scenarios occur {Repetitive material
        Unengaging activity
        Passive learning style
        Lack of interaction
        Technical difficulties
        Distracting environment
        Unclear learning goals
        Predictable routine
        Slow lecture pace
        Irrelevant content} the student is bored.
    
    Give the Answer in one word which is the most likely emotion.`

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const emotion = response.text();
    return { studentPID, message, emotion };
}


//Copilot generated code
function imageDataToGenerativePart(data, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(data).toString("base64"),
            mimeType
        },
    };
}

const prompt = `Analyze the following image and identify the student's most likely emotion: 
    if any of the following scenarios are seen in the image {
        Smiling, 
        Bright Eyes, 
        Relaxed Facial Muscles, 
        Raised Cheeks, 
        Engagement, 
        Positive Body Language
    } the student is happy.

    If any of the following scenarios are seen in the image {
        Raised Eyebrows, 
        Open Mouth, 
        Wide Eyes, 
        Shocked Expression, 
        Surprise, 
        Heightened alertness.
    } the student is surprised.

    If any of the following scenarios are seen in the image {
        Furrowed Brows, 
        Squinting, 
        Frowning, 
        Confused Expression, 
        Discomfort, 
        Tension.
    } the student is confused.

    If any of the following scenarios are seen in the image {
        Blank or Distant Look,
        Heavy-Lidded Eyes,
        Yawning or Sighing, 
        Slumped Posture, 
        Closed Eyes, 
        Fidgeting, 
        Disengagement, 
        Negative Body Language.
    } the student is bored. 
    (Choose from: Surprised, Confused, Happy, Bored).
    Give the Answer in one word which is the most likely emotion.
`;


async function ImageToEmotion(studentPID, imageUrl) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Analyze the following image and identify the student's most likely emotion: 
    if any of the following scenarios are seen in the image {
        Smiling, 
        Bright Eyes, 
        Relaxed Facial Muscles, 
        Raised Cheeks, 
        Engagement, 
        Positive Body Language
    } the student is happy.

    If any of the following scenarios are seen in the image {
        Raised Eyebrows, 
        Open Mouth, 
        Wide Eyes, 
        Shocked Expression, 
        Surprise, 
        Heightened alertness.
    } the student is surprised.

    If any of the following scenarios are seen in the image {
        Furrowed Brows, 
        Squinting, 
        Frowning, 
        Confused Expression, 
        Discomfort, 
        Tension.
    } the student is confused.

    If any of the following scenarios are seen in the image {
        Blank or Distant Look,
        Heavy-Lidded Eyes,
        Yawning or Sighing, 
        Slumped Posture, 
        Closed Eyes, 
        Fidgeting, 
        Disengagement, 
        Negative Body Language.
    } the student is bored. 
    (Choose from: Surprised, Confused, Happy, Bored).
    Give the Answer in one word which is the most likely emotion.`;

    // Fetch the image data
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageData = imageResponse.data;
    const imagePart = imageDataToGenerativePart(imageData, "image/jpeg");

    const result = await model.generateContent([prompt, imagePart]);
    const modelResponse = await result.response;
    const emotion = modelResponse.text();

    return { studentPID, emotion };
}



// async function insertMeetingReport(meet_id) {
//     // Create a new meeting report with all emotion values initialized to 0
//     const newMeetingReport = new MeetingReport({
//         meet_id: meet_id,
//         text_emotions: [{ happy: 0, sad: 0, confused: 0, excited: 0 }],
//         video_emotions: [{ happy: 0, sad: 0, confused: 0, excited: 0 }],
//         audio_emotions: [{ happy: 0, sad: 0, confused: 0, excited: 0 }]
//     });

//     // Save the new meeting report
//     await newMeetingReport.save();
// }

// async function insertStudentReport(meet_id, studentPID) {
//     // Create a new student report with all emotion values initialized to 0
//     const newStudentReport = new StudentReport({
//         meet_id: meet_id,
//         student_id: studentPID,
//         text_emotions: [{ happy: 0, sad: 0, confused: 0, excited: 0 }],
//         video_emotions: [{ happy: 0, sad: 0, confused: 0, excited: 0 }],
//         audio_emotions: [{ happy: 0, sad: 0, confused: 0, excited: 0 }]
//     });

//     // Save the new student report
//     await newStudentReport.save();
// }
async function insertMeetingReport(meet_id, host_id) {
    // Create a new meeting report with video_emotions initialized to an array containing the first emotion class
    const newMeetingReport = new MeetingReport({
        meet_id: meet_id,
        host_id: host_id
    });

    // Save the new meeting report
    await newMeetingReport.save();
}

async function insertStudentReport(meet_id, studentPID) {
    // Create a new student report with video_emotions initialized to an array containing the first emotion class
    const newStudentReport = new StudentReport({
        meet_id: meet_id,
        student_id: studentPID
    });

    // Save the new student report
    await newStudentReport.save();
}


async function updateMeetingReport(meet_id, host_id, emotion) {
    // Check if the meeting report exists
    const existingMeetingReport = await MeetingReport.findOne({ meet_id: meet_id });
    console.log(existingMeetingReport.video_emotions[0].happy)

    if (!existingMeetingReport) {
        // If the meeting report doesn't exist, create a new one and set the video emotion class value to 1
        await insertMeetingReport(meet_id, host_id);
        await MeetingReport.updateOne(
            // { meet_id: meet_id },
            { $inc: { [`video_emotions.0.${emotion}`]: 1 } }
        );
    } else {
        // If the meeting report exists, increment the existing emotion class value
        await MeetingReport.updateOne(
            // { meet_id: meet_id },
            { $inc: { [`video_emotions.0.${emotion}`]: 1 } }
        );
    }
}

async function updateStudentReport(meet_id, studentPID, emotion) {
    // Check if the student report exists
    const existingStudentReport = await StudentReport.findOne({ meet_id: meet_id, student_id: studentPID });

    if (!existingStudentReport) {
        // If the student report doesn't exist, create a new one and set the video emotion class value to 1
        await insertStudentReport(meet_id, studentPID);
        await StudentReport.updateOne(
            { meet_id: meet_id, student_id: studentPID },
            { $inc: { [`video_emotions.${emotion}`]: 1 } }
        );
    } else {
        // If the student report exists, increment the existing emotion class value
        await StudentReport.updateOne(
            { meet_id: meet_id, student_id: studentPID },
            { $inc: { [`video_emotions.${emotion}`]: 1 } }
        );
    }
}



// Function to run the generative model for an array of images
async function ImagesToEmotions(imgUrls) {
    const emotions = [];
    for (const imgData of imgUrls) {
        const { meet_id, host_id, studentPID, imageUrl } = imgData;
        const emotionData = await ImageToEmotion(studentPID, imageUrl);

        // Trim and convert emotion string to lowercase
        const trimmedLowercaseEmotion = emotionData.emotion.trim().toLowerCase();
        console.log(trimmedLowercaseEmotion);

        // Update meeting report
        await updateMeetingReport(meet_id, host_id, trimmedLowercaseEmotion);

        // Update student report
        // await updateStudentReport(meet_id, studentPID);

        emotions.push(emotionData);
    }
    return emotions;
}










// POST request to analyze emotion from the provided message
router.post('/text_to_emotion', async (req, res) => {
    try {
        const { studentPID, message } = req.body; // Extract studentPID and message from request body
        if (!studentPID || !message) throw new Error("Student PID and message are required.");

        const result = await textToEmotion(studentPID, message);
        res.json(result); // Send response as JSON
    } catch (error) {
        res.status(400).json({ error: error.message }); // Send error as JSON
    }
});

router.post('/images_to_emotions', async (req, res) => {
    try {
        const { imgUrls } = req.body; // Extract imgUrls from request body
        if (!Array.isArray(imgUrls)) throw new Error("imgUrls should be an array.");

        // Execute the runForImages function
        const emotions = await ImagesToEmotions(imgUrls);
        res.json({ emotions }); // Send response as JSON
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});



router.post('/images_to_emotions', async (req, res) => {
    try {
        const { imgUrls } = req.body; // Extract imgUrls from request body
        if (!Array.isArray(imgUrls)) throw new Error("imgUrls should be an array.");

        // Execute the runForImages function
        const emotions = await ImagesToEmotions(imgUrls);
        res.json({ emotions }); // Send response as JSON
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});






module.exports = router;