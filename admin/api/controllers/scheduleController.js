const db = require('../../database/db');

// Middlewares
const sanitizeId = require('../middlewares/querySanitizerMiddleware');
const uniqueId = require('../middlewares/uniqueIdGeneratorMiddleware');
const axios = require('axios');

// Fetch Schedule By ScheduleID
const getScheduleById = async (scheduleId) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM schedule_i WHERE sched_id = ?', [sanitizeId(scheduleId)], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

// Fetch Schedule By ScheduleID
const getScheduleByAppId = async (appId) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM schedule_i WHERE sched_appId = ?', [sanitizeId(appId)], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

const getScheduleByDate = async (date) => {
    return new Promise((resolve, reject) => {
        db.query(`SELECT 
                    schedule_i.sched_id, 
                    schedule_i.sched_date,
                    schedule_i.sched_zoomlink,
                    schedule_i.sched_appid,
                    schedule_i.sched_timestart,
                    schedule_i.sched_timedue,
                    application_i.app_institution,
                    application_i.app_email,
                    application_i.app_address,
                    application_i.app_type
                    FROM schedule_i 
                    INNER JOIN application_i ON schedule_i.sched_appid  = application_i.app_id 
                    WHERE sched_date = ?`, [date], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

// Fetch Schedules
const getSchedule = async (req, res) => {
    const { date } = req.params;
    try {
        const result = await getScheduleByDate(date);
        if (result.length > 0) {
            return res.status(200).json(result);
        } else {
            return res.status(200).json({ result: 'Schedule and Application does not exist' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

const getAppId = async (req, res) => {
    const { appId } = req.params;

    try {
        const result = await getScheduleByAppId(appId);
        if (result.length > 0) {
            return res.json(result);
        } else {
            return res.json("Application Id is not found");
        }
    } catch (error) {
        console.error(error);
    }
}

const getAllSchedule = async (req, res) => {
    try {
        const result = db.query('SELECT * FROM schedule_i');
        if (result.length > 0) {
            return res.status(200).json({result : result});
        } else {
            return res.status(404).json({result : "No schedules"});
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// Post, Update Schedule
const postSchedule = async (req, res) => {
    const { type, schedDate, schedAppId, schedZoomLink, schedStart, schedEnd, receiver, username } = req.body;

    try {
        const newId = uniqueId.uniqueIdGenerator();
        // Create a new schedule
        const uploadData = {
            receiver: receiver,
            zoomLink: schedZoomLink,
            timeOfInterview: schedDate,
            username: username,
            timeIn: schedStart,
            timeOut: schedEnd
        }

        db.query('INSERT INTO schedule_i (sched_id, sched_dateadded, sched_zoomlink, sched_date,sched_appid, sched_timestart, sched_timedue) VALUES (?, NOW(), ?, ?, ?, ?, ?)', [newId, schedZoomLink, schedDate, schedAppId, schedStart, schedEnd], (createError, createRes) => {
            if (createError) {
                console.log(createError);
                return res.status(500).json({ error: 'Failed to create schedule', reason: createError });
            }

            if (createRes.affectedRows > 0) {
                // Insert Email send here
                if (type === "f2f") {
                    axios.post('http://localhost:3400/membership/interview/f2f', uploadData);
                } else {
                    axios.post('http://localhost:3400/membership/interview/zoom', uploadData);
                }
                
                res.status(201).json({ message: 'Schedule created successfully'});
            } else {
                res.status(500).json({ error: 'Failed to create schedule' });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Update / Change Schedule
const changeSchedule = async (req, res) => {
    const { scheduleId, newDate, newStart, newEnd } = req.body;

    try {
        const result = await getScheduleById(scheduleId);

        if (result.length > 0 && result[0].hasOwnProperty('sched_id')) {
            db.query("UPDATE schedule_i SET sched_date = ?, sched_timestart = ?, sched_timedue = ?, sched_datemodified = NOW() WHERE sched_id = ?", [newDate, newStart, newEnd, sanitizeId(scheduleId)], (updateError, updateRes) => {
                if (updateError) {
                    console.log(updateError);
                    return res.status(500).json({ error: 'Failed to change schedule' });
                }

                if (updateRes.affectedRows > 0) {
                    return res.status(200).json({ message: 'Schedule changed successfully' });
                } else {
                    return res.status(500).json({ error: 'Failed to change schedule' });
                }
            });
        } else {
            return res.status(404).json({ error: 'Schedule does not exist' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};



// Delete Schedule
const deleteSchedule = async (req, res) => {
    const { scheduleId } = req.params;

    try {
        const result = await getScheduleById(scheduleId);

        if (result.length > 0 && result[0].hasOwnProperty('sched_id')) {
            db.query("UPDATE schedule_i SET sched_flag = 0 WHERE sched_id = ?", [sanitizeId(scheduleId)], (deleteError, deleteRes) => {
                if (deleteError) {
                    console.log(deleteError);
                    return res.status(500).json({ error: 'Failed to delete schedule' });
                }

                if (deleteRes.affectedRows > 0) {
                    return res.status(200).json({ message: 'Schedule deleted successfully' });
                } else {
                    return res.status(500).json({ error: 'Failed to delete schedule' });
                }
            });
        } else {
            return res.status(404).json({ error: 'Schedule does not exist' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getSchedule,
    getAllSchedule,
    getAppId,
    postSchedule,
    changeSchedule,
    deleteSchedule,
};


