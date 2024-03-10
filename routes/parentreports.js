const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();
const axios = require("axios");
const fs = require("fs");
const sharp = require("sharp");
const https = require("https");
const mongoose = require('mongoose');
const MeetingReport = require("../schemas/MeetingReportsSchema");
const MeetingTimestamp = require("../schemas/MeetingTimestampsSchema");
const StudentReport = require("../schemas/StudentReportSchema");
const User = require("../schemas/UserSchema");


const genAI = new GoogleGenerativeAI("AIzaSyCTYERXkGoRT7Vh1jiyzfcVVyxT-2rL-2M");



router.post('/meetings', async (req, res) => {
    try {
        const { student_id } = req.body; // Extract student_id from request body

        // Find all entries where student_id equals student_id
        const reports = await StudentReport.find({ student_id: student_id });

        // Find the corresponding meeting details for each report
        const detailedReports = await Promise.all(reports.map(async (report) => {
            const meetingDetails = await MeetingReport.findOne({ meet_id: report.meet_id });
            return {
                ...report._doc,
                title: meetingDetails.title,
                host_name: meetingDetails.host_name,
                description: meetingDetails.description
            };
        }));

        res.json({ detailedReports }); // Send response as JSON
    } catch (error) {
        console.error(error); // Log the error to the console
        res.status(500).json({ error: error.message });
    }
});


router.post('/personal_meeting_report', async (req, res) => {
    try {
        const { student_id, meet_id } = req.body; // Extract student_id and meet_id from request body

        // Find all entries where student_id equals student_id and meet_id equals meet_id
        const reports = await StudentReport.find({ student_id: student_id, meet_id: meet_id });

        res.json({ reports }); // Send response as JSON
    } catch (error) {
        console.error(error); // Log the error to the console
        res.status(500).json({ error: error.message });
    }
});
router.post('/overall_meeting_report', async (req, res) => {
    try {
        const { meet_id } = req.body; // Extract meet_id from request body

        // Find all entries with the provided meet_id and exclude host_id
        const reports = await MeetingReport.find({ meet_id: meet_id }, '-host_id');

        res.json({ reports }); // Send response as JSON
    } catch (error) {
        console.error(error); // Log the error to the console
        res.status(400).json({ error: error.message });
    }
});


router.post('/get_meeting_timestamps', async (req, res) => {
    try {
        const { meet_id } = req.body; // Extract meet_id from request body

        // Define all possible modeTypes
        const modeTypes = ["video", "audio", "text"];

        // Find all entries with the provided meet_id
        let timestamps_data = await MeetingTimestamp.find({ meet_id: meet_id });

        // Convert timestamps_data to a map for easy access
        const timestamps_map = new Map();
        timestamps_data.forEach((data) => {
            timestamps_map.set(data.modeType, data);
        });

        // Ensure all modeTypes are present in the response
        modeTypes.forEach((modeType) => {
            if (!timestamps_map.has(modeType)) {
                // If a modeType is not present, add an empty entry for it
                timestamps_data.push({
                    _id: mongoose.Types.ObjectId(),
                    meet_id: meet_id,
                    modeType: modeType,
                    timestamps: [],
                    __v: 1
                });
            }
        });

        res.json({timestamps_data }); // Send response as JSON
    } catch (error) {
        console.error(error); // Log the error to the console
        res.status(400).json({ error: error.message });
    }
});






async function generateConclusion(disability, meetReport, studentReport) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    console.log("Reached here")
    const prompt = `Given the student's emotional report during the meeting as ${JSON.stringify(studentReport)}, and the overall emotional report of the meeting as ${JSON.stringify(meetReport)}, generate a conclusion paragraph for the student's parents. Consider the student's disability carefully while providing the conclusion. If the student's emotions were decent in the call, it's a good thing. If the student's emotions were not so good and the emotions of the entire class were of similar kind, then probably the teacher needs to improve. If the student's emotions were not so good but the rest of the students from the class were OK, provide positive words to improve.`;

    const result = await model.generateContent(prompt);
    console.log("Result", result);
    const response = await result.response;
    const conclusion = response.text();
    console.log("Conclusion", conclusion);
    return conclusion;
}

router.post('/generate_conclusion', async (req, res) => {
    try {
        const { meet_id, student_id } = req.body;

        const user = await User.findOne({ pid: student_id });
        const meetReport = await MeetingReport.findOne({ meet_id: meet_id });
        const studentReport = await StudentReport.findOne({ meet_id: meet_id, student_id: student_id });

        if (!user || !meetReport || !studentReport) throw new Error("User or report not found.");

        const conclusion = await generateConclusion(user.disability, meetReport, studentReport);

        res.json({ conclusion: conclusion });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});




module.exports = router;
