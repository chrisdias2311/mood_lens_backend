const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();
const axios = require("axios");
const fs = require("fs");
const sharp = require("sharp");
const https = require("https");

const MeetingReport = require("../schemas/MeetingReportsSchema");
const MeetingTimestamp = require("../schemas/MeetingTimestampsSchema");
const StudentReport = require("../schemas/StudentReportSchema");


const genAI = new GoogleGenerativeAI("AIzaSyB0TW1vcbeM8a56Uo8GT0TBriUZgDCfwdE");


// Genertive AI part of the code to predict emotions from images
function imageDataToGenerativePart(data, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(data).toString("base64"),
            mimeType
        },
    };
}
async function ImageToEmotion(studentPID, imageUrl) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
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

    If there is no human face in the image, the student is not found, so the emotion is pnf.

    (Choose from: Surprised, Confused, Happy, Bored, pnf).
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








router.post('/video_to_emotion', async (req, res) => {
    try {
        const { meet_id, host_id, time_stamp, imgUrls } = req.body; // Extract meet_id, host_id, and imgUrls from request body
        if (!Array.isArray(imgUrls)) {
            throw new Error("imgUrls should be an array.");
        }

        // Execute the runForImages function
        const emotions = await ImagesToEmotions(meet_id, host_id, imgUrls);
        const emotionCounts = countEmotions(emotions);

        // console.log(emotionCounts);
        // console.log(emotions);

        // Create a new MeetingTimestamp in the database
        createMeetingTimestamp(meet_id, host_id, time_stamp, emotionCounts);     // Do not add await here, function is not critical to the response hence can be executed asynchronously to save response time 

        res.json({ emotions }); // Send response as JSON
    } catch (error) {
        console.error(error); // Log the error to the console
        res.status(400).json({ error: error.message });
    }
});

router.get('/video_timestamps/:meet_id', async (req, res) => {
    try {
        const { meet_id } = req.params; // Extract meet_id from request parameters

        // Find all timestamps where meet_id equals meet_id and modeType equals "video", sorted by report_no
        const timestamps = await MeetingTimestamp.find({ meet_id: meet_id, modeType: "video" }).sort('report_no');

        res.json({ timestamps }); // Send response as JSON
    } catch (error) {
        console.error(error); // Log the error to the console
        res.status(500).json({ error: error.message });
    }
});







async function ImagesToEmotions(meet_id, host_id, imgUrls) {
    const emotions = [];
    for (const imgData of imgUrls) {
        const { studentPID, imageUrl } = imgData;
        const emotionArr = ["happy", "confused", "surprised", "bored", "pnf"];
        const regex = new RegExp(emotionArr.join("|"), "i");

        const emotionData = await ImageToEmotion(studentPID, imageUrl);
        // Trim and convert emotion string to lowercase
        const trimmedLowercaseEmotion = emotionData.emotion.trim().toLowerCase();

        var finalEmotion = trimmedLowercaseEmotion;
        const match = trimmedLowercaseEmotion.match(regex);
        if (match) {
            // If a match was found, it will be the first element in the 'match' array
            finalEmotion = match[0];
            console.log("Final Emo:", finalEmotion);
        } else {
            finalEmotion = "pnf";
            console.log("Final:", finalEmotion);
        }

        // Update meeting report
        await updateMeetingReport(meet_id, host_id, finalEmotion);
        // Update student report
        await updateStudentReport(meet_id, studentPID, finalEmotion);
        emotions.push(emotionData);
    }
    return emotions;
}







async function updateStudentReport(meet_id, studentPID, emotion) {
    // Check if the student report exists
    const existingStudentReport = await StudentReport.findOne({ meet_id: meet_id, student_id: studentPID });

    if (!existingStudentReport) {
        await createStudentReport(meet_id, studentPID);
    }

    console.log(`video_emotions.0.${emotion}`);
    // Increment the existing emotion class value
    await StudentReport.updateOne(
        { meet_id: meet_id, student_id: studentPID },
        { $inc: { [`video_emotions.0.${emotion}`]: 1 } }
    );
}
async function createStudentReport(meet_id, studentPID) {
    // Create a new student report with video_emotions initialized to an array containing the first emotion class
    const newStudentReport = new StudentReport({
        meet_id: meet_id,
        student_id: studentPID
    });

    // Save the new student report
    await newStudentReport.save();
}






async function updateMeetingReport(meet_id, host_id, emotion) {
    const existingMeetingReport = await MeetingReport.findOne({ meet_id: meet_id });

    if (!existingMeetingReport) {
        await insertMeetingReport(meet_id, host_id);
    }

    // Increment the existing emotion class value
    await MeetingReport.updateOne(
        { meet_id: meet_id },
        { $inc: { [`video_emotions.0.${emotion}`]: 1 } }
    );
}
async function insertMeetingReport(meet_id, host_id) {
    const newMeetingReport = new MeetingReport({
        meet_id: meet_id,
        host_id: host_id
    });

    // Save the new meeting report
    await newMeetingReport.save();
}





function countEmotions(emotions) {
    const counts = {};
    const emotionArr = ["happy", "confused", "surprised", "bored", "pnf"];
    const regex = new RegExp(emotionArr.join("|"), "i");

    for (const emotionData of emotions) {
        // Trim and convert emotion string to lowercase
        const trimmedLowercaseEmotion = emotionData.emotion.trim().toLowerCase();
        var finalEmotion = trimmedLowercaseEmotion;
        const match = trimmedLowercaseEmotion.match(regex);
        finalEmotion = match[0];

        // If this emotion has been seen before, increment its count
        if (counts[finalEmotion]) {
            counts[finalEmotion]++;
        } else {
            // Otherwise, initialize this emotion's count to 1
            counts[finalEmotion] = 1;
        }
    }
    return counts;
}
async function createMeetingTimestamp(meet_id, host_id, timeStamp, emotionCounts) {
    // Calculate report_no as the length of entries in the meeting reports which have meet_id = current meeting id
    const report_no = await MeetingTimestamp.countDocuments({ meet_id: meet_id , modeType: "video"});

    // Create a new MeetingTimestamp
    const newMeetingTimestamp = new MeetingTimestamp({
        meet_id: meet_id,
        host_id: host_id,
        report_no: report_no,
        timeStamp: timeStamp,
        modeType: "video",
        emotions: [emotionCounts] // Update the emotion counts
    });

    // Save the new MeetingTimestamp
    await newMeetingTimestamp.save();
}


















//THis code had array of object and where each object had meet_id, host_id, studentPID, imageUrl

// Function to run the generative model for an array of images
// async function ImagesToEmotions(imgUrls) {
//     const emotions = [];
//     for (const imgData of imgUrls) {
//         const { meet_id, host_id, studentPID, imageUrl } = imgData;
//         const emotionArr = ["happy", "confused", "surprised", "bored", "pnf"];
//         const regex = new RegExp(emotionArr.join("|"), "i");

//         const emotionData = await ImageToEmotion(studentPID, imageUrl);
//         // Trim and convert emotion string to lowercase
//         const trimmedLowercaseEmotion = emotionData.emotion.trim().toLowerCase();

//         var finalEmotion = trimmedLowercaseEmotion;
//         const match = trimmedLowercaseEmotion.match(regex);
//         if (match) {
//             // If a match was found, it will be the first element in the 'match' array
//             finalEmotion = match[0];
//             console.log("Final Emo:", finalEmotion); 
//         } else {
//             finalEmotion = "pnf";
//             console.log("Final:", finalEmotion); 
//         }

//         // Update meeting report
//         await updateMeetingReport(meet_id, host_id, finalEmotion);

//         emotions.push(emotionData);
//     }
//     return emotions;
// }

// router.post('/video_to_emotion', async (req, res) => {
//     try {
//         const { imgUrls } = req.body; // Extract imgUrls from request body
//         if (!Array.isArray(imgUrls)) {
//             throw new Error("imgUrls should be an array.");
//         }

//         // Execute the runForImages function
//         const emotions = await ImagesToEmotions(imgUrls);
//         res.json({ emotions }); // Send response as JSON
//     } catch (error) {
//         console.error(error); // Log the error to the console
//         res.status(400).json({ error: error.message });
//     }
// });











// async function insertMeetingReport(meet_id, host_id) {
//     // Create a new meeting report with video_emotions initialized to an array containing the first emotion class

//     const newMeetingReport = new MeetingReport({
//         meet_id: meet_id,
//         host_id: host_id
//     });

//     // Save the new meeting report
//     const saved = await newMeetingReport.save();
//     console.log(saved);
// }

// async function createStudentReport(meet_id, studentPID) {
//     // Create a new student report with video_emotions initialized to an array containing the first emotion class
//     const newStudentReport = new StudentReport({
//         meet_id: meet_id,
//         student_id: studentPID
//     });

//     // Save the new student report
//     await newStudentReport.save();
// }


// async function updateMeetingReport(meet_id, host_id, emotion) {
//     // Check if the meeting report exists
//     const existingMeetingReport = await MeetingReport.findOne({ meet_id: meet_id });
//     console.log(existingMeetingReport.video_emotions[0])

//     if (!existingMeetingReport) {
//         // If the meeting report doesn't exist, create a new one and set the video emotion class value to 1
//         await insertMeetingReport(meet_id, host_id);
//         await MeetingReport.updateOne(
//             // { meet_id: meet_id },
//             { $inc: { [`video_emotions.0.${emotion}`]: 1 } }
//         );
//     } else {
//         // If the meeting report exists, increment the existing emotion class value
//         await MeetingReport.updateOne(
//             // { meet_id: meet_id },
//             { $inc: { [`video_emotions.0.${emotion}`]: 1 } }
//         );
//     }
// }

// async function updateStudentReport(meet_id, studentPID, emotion) {
//     // Check if the student report exists
//     const existingStudentReport = await StudentReport.findOne({ meet_id: meet_id, student_id: studentPID });

//     if (!existingStudentReport) {
//         // If the student report doesn't exist, create a new one and set the video emotion class value to 1
//         await createStudentReport(meet_id, studentPID);
//         await StudentReport.updateOne(
//             { meet_id: meet_id, student_id: studentPID },
//             { $inc: { [`video_emotions.${emotion}`]: 1 } }
//         );
//     } else {
//         // If the student report exists, increment the existing emotion class value
//         await StudentReport.updateOne(
//             { meet_id: meet_id, student_id: studentPID },
//             { $inc: { [`video_emotions.${emotion}`]: 1 } }
//         );
//     }
// }

// // Function to run the generative model for an array of images
// async function ImagesToEmotions(imgUrls) {
//     const emotions = [];
//     for (const imgData of imgUrls) {
//         const { meet_id, host_id, studentPID, imageUrl } = imgData;
//         const emotionData = await ImageToEmotion(studentPID, imageUrl);

//         // Trim and convert emotion string to lowercase
//         const trimmedLowercaseEmotion = emotionData.emotion.trim().toLowerCase();
//         console.log(trimmedLowercaseEmotion);

//         // Update meeting report
//         await updateMeetingReport(meet_id, host_id, trimmedLowercaseEmotion);

//         // Update student report
//         // await updateStudentReport(meet_id, studentPID);

//         emotions.push(emotionData);
//     }
//     return emotions;
// }


// router.post('/video_to_emotion', async (req, res) => {
//     try {
//         const { imgUrls } = req.body; // Extract imgUrls from request body
//         if (!Array.isArray(imgUrls)) throw new Error("imgUrls should be an array.");

//         // Execute the runForImages function
//         const emotions = await ImagesToEmotions(imgUrls);
//         res.json({ emotions }); // Send response as JSON
//     } catch (error) {
//         res.status(400).json({ error: error.message });
//     }
// });


module.exports = router;