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



router.post("/create_meeting", async (req, res) => {
    try {
        // Generate a random 4-digit code
        let meet_id = generateRandomCode();

        // Check if a meeting with the same meet_id already exists
        let existingMeeting = await MeetingReport.findOne({ meet_id: meet_id });

        // If a meeting with the same meet_id exists, generate a new code
        while (existingMeeting) {
            meet_id = generateRandomCode();
            existingMeeting = await MeetingReport.findOne({ meet_id: meet_id });
        }

        // Create the new meeting
        const newMeeting = new MeetingReport({
            meet_id: meet_id,
            host_id: req.body.host_id,
            title: req.body.title,
            description: req.body.description,
            startTime: req.body.startTime,
            endTime: req.body.endTime,
            host_name: req.body.host_name
        });

        // Save the new meeting to the database
        await newMeeting.save();

        // Send the meet_id in the response
        res.json({ meet_id: meet_id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

function generateRandomCode() {
    return Math.floor(1000 + Math.random() * 9000); // Generate a random 4-digit number
}


module.exports = router;

