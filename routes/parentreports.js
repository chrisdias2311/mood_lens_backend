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

        // Find all entries with the provided meet_id
        const timestamps = await MeetingTimestamp.find({ meet_id: meet_id });

        res.json({timestamps }); // Send response as JSON
    } catch (error) {
        console.error(error); // Log the error to the console
        res.status(400).json({ error: error.message });
    }
});




module.exports = router;
