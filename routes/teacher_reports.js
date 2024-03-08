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
async function generateTeachReport(studentPID, message) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Analyze the following data of emotions captured from multiple modes (Video, In-call-messages, and Audio) of students in a virtual classroom and prepare a feedback report for the teacher.



    
    `

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const emotion = response.text();
    // return { studentPID, message, emotion };
    return emotion;
}


router.post('/teacher_feedback_report', async (req, res) => {
    try {
        const { meet_id, host_id } = req.body; // Extract meet_id, host_id, and imgUrls from request 

        console.log(updatedMeetReports);
        res.json({ updatedMeetReports }); // Send response as JSON
    } catch (error) {
        console.error(error); // Log the error to the console
        res.status(400).json({ error: error.message });
    }
});