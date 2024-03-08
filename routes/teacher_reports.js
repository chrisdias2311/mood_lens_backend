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
async function getSampleTimeStampsReport(timestamps, sampleTimeStampsReportFormat) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Analyze the timestamps of following data of emotions captured from multiple modes (Video, In-call-messages, and Audio) of students in a virtual classroom and prepare a feedback report for the teacher.
    The following are the timestamps
    ${timestamps}
  
    For modeType: "Video", A batch of images which contains images of all the students present in the meeting is captured every 10 seconds and then the emotions are captured from the images. The timestamp is then stored in the database which the emotions are captured from the images at that particular instance of time.
  
    For modeType: "In-call-messages", Everytime a student send a message in the chat, the message is analyzed and the emotion is captured. The timestamp is then stored in the database which the emotions are captured from the message at that particular instance of time.
  
    For modeType: "Audio", The audio of the students is captured and then the emotions are captured from the audio. The timestamp is then stored in the database which the emotions are captured from the audio at that particular instance of time.
  
    I want you to analyze tha time stamps and prepare a detailed timeline feedback report for the teacher. I would need the report in a JSON format and this is how the format of the report should be: 
    ${sampleTimeStampsReportFormat}
  
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    // **Remove special characters (consider potential downsides)**
    let cleanedResponse = response.text()
        .replace(/[^a-zA-Z0-9\s!@#$%^&*()]/g, "") // Remove most special characters
        .replace(/\s+/g, " ") // Replace multiple spaces with single space
        .trim(); // Remove leading/trailing whitespace

    // **Handle potential non-JSON output**
    let timeStampsReport;
    try {
        timeStampsReport = JSON.parse(cleanedResponse);
    } catch (error) {
        console.error("Error parsing response as JSON:", error);
        // Handle the error here, potentially return a default report or throw a new error
    }

    return timeStampsReport;
}


async function getSampleTimeStampsReport(timestamps, sampleTimeStampsReportFormat) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Analyze the timestamps of following data of emotions captured from multiple modes (Video, In-call-messages, and Audio) of students in a virtual classroom and prepare a feedback report for the teacher.
    The following are the timestamps
    ${timestamps}
  
    For modeType: "Video", A batch of images which contains images of all the students present in the meeting is captured every 10 seconds and then the emotions are captured from the images. The timestamp is then stored in the database which the emotions are captured from the images at that particular instance of time.
  
    For modeType: "In-call-messages", Everytime a student send a message in the chat, the message is analyzed and the emotion is captured. The timestamp is then stored in the database which the emotions are captured from the message at that particular instance of time.
  
    For modeType: "Audio", The audio of the students is captured and then the emotions are captured from the audio. The timestamp is then stored in the database which the emotions are captured from the audio at that particular instance of time.
  
    I want you to analyze tha time stamps and prepare a detailed timeline feedback report for the teacher. I would need the report in a JSON format and this is how the format of the report should be: 
    ${sampleTimeStampsReportFormat}
  
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    // **Remove all special characters except full stop and comma**
    let cleanedResponse = response.text()
        .replace(/[^\s.,]/g) // Remove most special characters, keep letters, numbers, space, comma, and full stop
        .replace(/\s+/g, " ") // Replace multiple spaces with single space
        .trim(); // Remove leading/trailing whitespace

    // **Handle potential non-JSON output**
    let timeStampsReport;
    try {
        timeStampsReport = JSON.parse(cleanedResponse);
    } catch (error) {
        console.error("Error parsing response as JSON:", error);
        console.error("Problematic response snippet:", cleanedResponse.substring(0, 100)); // Log a snippet
        // Handle the error here (consider returning a partial report or default report)
    }

    return timeStampsReport;
}






router.post('/teacher_feedback_report', async (req, res) => {
    try {
        const { meet_id, host_id } = req.body; // Extract meet_id, host_id, and imgUrls from request 

        let timeStamps = await findMeetingTimestampsByMeetId(meet_id);

        // Map over the timestamps to create a new array with only the desired properties
        const filteredTimeStamps = timeStamps.map(({ modeType, timestamps }) => ({
            modeType,
            timestamps: timestamps.map(({ timeStamp, emotions }) => ({ timeStamp, emotions }))
        }));
        timeStamps = JSON.stringify(filteredTimeStamps, null, 2); // Print timestamps in a readable format

        const timeStampsReport = await getSampleTimeStampsReport(timeStamps, sampleTimeStampsReportFormat);
        console.log(timeStampsReport);

        res.json({ report: timeStampsReport }); // Send response as JSON
    } catch (error) {
        console.error(error); // Log the error to the console
        res.status(400).json({ error: error.message });
    }
});



async function findMeetingTimestampsByMeetId(meetId) {
    try {
        const meetingTimestamps = await MeetingTimestamp.find({ meet_id: meetId });
        return meetingTimestamps;
    } catch (error) {
        console.error("Error finding meeting timestamps:", error);
        throw error;
    }
}




const sampleTimeStampsReportFormat = `{
    "Lecture Emotions Summary": "This report provides a summary of the students’ emotional responses during your recent lecture. The emotions tracked were: Happy, Confused, Surprised, Bored, and Person Not Found (PNF).
    The lecture started on a positive note with most students exhibiting a Happy emotion. As the lecture progressed, some students started to show signs of being Bored. This could be due to a variety of factors such as the complexity of the topic, pace of the lecture, or lack of interactive elements to keep the students engaged.
    Towards the end of the lecture, the students’ emotions shifted back to Happy. This could indicate that the concluding part of your lecture was effective in recapturing the students’ interest.
    Throughout the lecture, there were instances of Confused and Surprised emotions. These could be points in the lecture where the material was either not clear or unexpected for the students. The Person Not Found (PNF) instances could indicate times when a student was not present in front of their device.", 

    "Recommendations for the Teacher": "Based on this analysis, here are some recommendations for future lectures:
    Maintain the positive start: The happy emotion at the start of the lecture is a good sign. Continue with your engaging introduction of lecture topics.
    Increase interactivity: To prevent boredom, try to make the lecture more interactive. Use quizzes, discussions, or real-world examples to keep the students engaged.
    Clarify and summarize: Regularly summarize the key points and encourage students to ask questions if they’re confused.
    Address PNF instances: If PNF instances are high, remind students about the importance of continuous learning and the disadvantages of missing parts of the lecture.
    We hope this report helps you in enhancing the effectiveness of your future lectures. Keep up the good work!"
}





`

module.exports = router;