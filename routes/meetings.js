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
            endTime: "",
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



router.post('/join_meeting', async (req, res) => {
    try {
        const meeting = await MeetingReport.findOne({ meet_id: req.body.meet_id });
        if (!meeting) {
            return res.status(400).json({ message: 'Meeting not found' });
        }

        if (meeting.endTime === '') {
            return res.status(200).json({ message: 'The meeting is currently happening' });
        } else {
            return res.status(400).json({ message: 'The meeting has ended' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server error' });
    }
});

router.post('/end_meeting', async (req, res) => {
    try {
        const { meet_id, endTime } = req.body;
        const meeting = await MeetingReport.findOne({ meet_id: meet_id });
        if (!meeting) {
            return res.status(400).json({ message: 'Meeting not found' });
        }

        meeting.endTime = endTime;
        await meeting.save();

        return res.json({ message: 'Meeting ended successfully', meeting });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});




module.exports = router;

