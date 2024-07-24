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
const User = require("../schemas/UserSchema");
const { update } = require('../schemas/UserSchema');


const genAI = new GoogleGenerativeAI("AIzaSyAGbRvDFK9HwhytwYY9613KTZTfh94GWWo");


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
        const updatedMeetReports = await ImagesToEmotions(meet_id, host_id, imgUrls, time_stamp);
        // const emotionCounts = countEmotions(emotions);

        // console.log(emotionCounts);
        // console.log(emotions);

        // Create a new MeetingTimestamp in the database
        // createMeetingTimestamp(meet_id, host_id, time_stamp, emotionCounts);     // Do not add await here, function is not critical to the response hence can be executed asynchronously to save response time 
        console.log(updatedMeetReports);
        const overallEmotions = {
            "happy": updatedMeetReports.text_emotions[0].happy + updatedMeetReports.video_emotions[0].happy + updatedMeetReports.audio_emotions[0].happy,
            "surprised": updatedMeetReports.text_emotions[0].surprised + updatedMeetReports.video_emotions[0].surprised + updatedMeetReports.audio_emotions[0].surprised,
            "confused": updatedMeetReports.text_emotions[0].confused + updatedMeetReports.video_emotions[0].confused + updatedMeetReports.audio_emotions[0].confused,
            "bored": updatedMeetReports.text_emotions[0].bored + updatedMeetReports.video_emotions[0].bored + updatedMeetReports.audio_emotions[0].bored,
            "pnf": updatedMeetReports.text_emotions[0].pnf + updatedMeetReports.video_emotions[0].pnf + updatedMeetReports.audio_emotions[0].pnf
        };

        const studentLiveEmotions = await getStudentLiveEmotions(meet_id);
        res.json({ updatedMeetReports, overallEmotions, studentLiveEmotions }); // Send response as JSON
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


// router.post('/get_student_live_analytics', async (req, res) => {
//     try {
//         const { meet_id } = req.body; // Extract meet_id, host_id, and imgUrls from request body
//         // if (!Array.isArray(imgUrls)) {
//         //     throw new Error("imgUrls should be an array.");
//         // }

//         const studentLiveEmotions = await getStudentLiveEmotions(meet_id);
        
//         res.json({ studentLiveEmotions });

//     } catch (error) {
//         console.error(error); // Log the error to the console
//         res.status(400).json({ error: error.message });
//     }
// });







async function ImagesToEmotions(meet_id, host_id, imgUrls, time_stamp) {
    const emotions = [];
    let finalMeetingReport = null;
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

        // Update student report
        updateStudentReport(meet_id, studentPID, finalEmotion);
        // Update meeting report
        finalMeetingReport = await updateMeetingReport(meet_id, host_id, finalEmotion);

        emotions.push(emotionData);
    }
    const emotionCounts = countEmotions(emotions);
    createMeetingTimestamp(meet_id, host_id, time_stamp, emotionCounts); 
    return finalMeetingReport;
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
    const updatedMeetingReport = await MeetingReport.findOneAndUpdate(
        { meet_id: meet_id },
        { $inc: { [`video_emotions.0.${emotion}`]: 1 } }
    );
    console.log("=====================================")
    console.log("Updated:", updatedMeetingReport)
    return updatedMeetingReport;
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
    // Find the meeting timestamp document for the current meeting id and modeType
    let meetingTimestamp = await MeetingTimestamp.findOne({ meet_id: meet_id, modeType: "video" });

    // If the document doesn't exist, create a new one
    if (!meetingTimestamp) {
        meetingTimestamp = new MeetingTimestamp({
            meet_id: meet_id,
            modeType: "video",
            timestamps: []
        });
    }

    // Calculate report_no as the length of the timestamps array
    const report_no = meetingTimestamp.timestamps.length;

    // Create a new timestamp
    const newTimestamp = {
        report_no: report_no,
        timeStamp: timeStamp,
        emotions: [emotionCounts] // Update the emotion counts
    };

    // Append the new timestamp to the timestamps array
    meetingTimestamp.timestamps.push(newTimestamp);
    console.log("MeetingTimestamp:", meetingTimestamp)

    // Save the updated MeetingTimestamp
    await meetingTimestamp.save();
}


async function getStudentLiveEmotions(meet_id) {
    // Get all students where meet_id = meet_id
    const studentReports = await StudentReport.find({ meet_id: meet_id }).lean();

    // Process the students list
    const studentLiveEmotions = await Promise.all(studentReports.map(async (report) => {
        // Find the student's username
        const user = await User.findOne({ pid: report.student_id }).lean();
        const username = user ? user.userName : null;

        // Create an object for each student
        const studentEmotion = {
            student_id: report.student_id,
            username: username,
            text_emotion: getMaxEmotion(report.text_emotions),
            video_emotion: getMaxEmotion(report.video_emotions),
            audio_emotion: getMaxEmotion(report.audio_emotions)
        };

        // Calculate the overall emotion
        const allEmotions = [...report.text_emotions, ...report.video_emotions, ...report.audio_emotions];
        studentEmotion.overall_emotion = getMaxEmotion(allEmotions);

        return studentEmotion;
    }));

    return studentLiveEmotions;
}





function getMaxEmotion(emotionsArray) {
    let maxEmotion = "";
    let maxValue = 0;
    let nonZeroValuesExist = false;

    // Iterate over all objects in the array
    for (const emotions of emotionsArray) {
        for (const emotion in emotions) {
            if (emotions[emotion] !== 0) {
                nonZeroValuesExist = true;
                if (emotions[emotion] > maxValue) {
                    maxEmotion = emotion;
                    maxValue = emotions[emotion];
                }
            }
        }
    }

    return nonZeroValuesExist ? maxEmotion : ""; // Return empty string if all values are 0
}


function getFinalMaxEmotions(emotionTypesArray) {
    let maxEmotion = "";
    let maxValue = 0;
    let nonZeroValuesExist = false;

    // Iterate over all objects in the array
    for(const emotionsArray of emotionTypesArray) {
        for (const emotions of emotionsArray) {
            for (const emotion in emotions) {
                if (emotions[emotion] !== 0) {
                    nonZeroValuesExist = true;
                    if (emotions[emotion] > maxValue) {
                        maxEmotion = emotion;
                        maxValue = emotions[emotion];
                    }
                }
            }
        }
    }
    // for (const emotions of emotionsArray) {
    //     for (const emotion in emotions) {
    //         if (emotions[emotion] !== 0) {
    //             nonZeroValuesExist = true;
    //             if (emotions[emotion] > maxValue) {
    //                 maxEmotion = emotion;
    //                 maxValue = emotions[emotion];
    //             }
    //         }
    //     }
    // }

    return nonZeroValuesExist ? maxEmotion : ""; // Return empty string if all values are 0
}







// async function getStudentLiveEmotions(meet_id) {
//     try {
//         // Find all students with the given meet_id
//         const students = await StudentReport.find({ meet_id });

//         // Array to store final results
//         const studentLiveEmotions = [];

//         // Iterate through each student
//         for (const student of students) {
//             // Extract student_id
//             const { student_id } = student;

//             // Fetch username from User schema using student_id
//             const user = await User.findOne({ pid: student_id });
//             const username = user ? user.userName : 'Unknown';

//             // Calculate max emotion for text_emotions
//             const text_emotion_max = getMaxEmotion(student.text_emotions);

//             // Calculate max emotion for video_emotions
//             const video_emotion_max = getMaxEmotion(student.video_emotions);

//             // Calculate max emotion for audio_emotions
//             const audio_emotion_max = getMaxEmotion(student.audio_emotions);

//             // Construct the object for this student
//             const studentEmotion = {
//                 student_id,
//                 username,
//                 text_emotion: text_emotion_max,
//                 video_emotion: video_emotion_max,
//                 audio_emotion: audio_emotion_max
//             };

//             // Push the student's emotion object to the final array
//             studentLiveEmotions.push(studentEmotion);
//         }

//         return studentLiveEmotions;
//     } catch (error) {
//         throw error;
//     }
// }

// // Helper function to get the max emotion from an array of emotions
// // Helper function to get the max emotion from an array of emotions
// function getMaxEmotion(emotions) {
//     let maxEmotion = '';
//     let maxValue = 0;

//     emotions.forEach(emotion => {
//         for (const [key, value] of Object.entries(emotion)) {
//             console.log("Key: ", key, "Value: ", value)
//             if (key !== 'pnf' && value > maxValue) {
//                 maxEmotion = key;
//                 maxValue = value;
//             }
//         }
//     });

//     return maxEmotion;
// }







// async function createMeetingTimestamp(meet_id, host_id, timeStamp, emotionCounts) {
//     // Calculate report_no as the length of entries in the meeting reports which have meet_id = current meeting id
//     const report_no = await MeetingTimestamp.countDocuments({ meet_id: meet_id , modeType: "video"});

//     // Create a new MeetingTimestamp
//     const newMeetingTimestamp = new MeetingTimestamp({
//         meet_id: meet_id,
//         host_id: host_id,
//         report_no: report_no,
//         timeStamp: timeStamp,
//         modeType: "video",
//         emotions: [emotionCounts] // Update the emotion counts
//     });

//     // Save the new MeetingTimestamp
//     await newMeetingTimestamp.save();
// }





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