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

        res.json({ reports }); // Send response as JSON
    } catch (error) {
        console.error(error); // Log the error to the console
        res.status(500).json({ error: error.message });
    }
});

router.post('/student_reports', async (req, res) => {
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

module.exports = router;