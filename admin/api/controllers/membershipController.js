const db = require('../../database/db');
const moment = require('moment');
const axios = require('axios');


const restrictMember = async (req, res) => {
    const { valid, memberId, memberName, email } = req.body;
    let formatted, formattedText;

    try {
        switch (valid) {
            case "7days":
                const nextWeek = moment().add(7, "days");
                formatted = nextWeek.format('YYYY-MM-DD');
                formattedText = nextWeek.format('MMMM DD, YYYY');
                axios.post(`${process.env.EMAIL_DOMAIN}/admin/restrict`, {
                    receiver: email,
                    duration: formattedText,
                    memberName: memberName
                });
                break;
            case "1month":
                const nextMonth = moment().add(1, "month"); 
                formatted = nextMonth.format('YYYY-MM-DD');
                formattedText = nextMonth.format('MMMM DD, YYYY');
                axios.post(`${process.env.EMAIL_DOMAIN}/admin/restrict`, {
                    receiver: email,
                    duration: formattedText,
                    memberName: memberName
                });
                break;
            case "Permanent":
                const removeResult = await removeMember(memberId); 
                axios.post(`${process.env.EMAIL_DOMAIN}/admin/remove`, {
                    receiver: email,
                    memberName: memberName
                });
                return res.json(removeResult);
            default:
                throw new Error("Invalid validity specified.");
        }
    
        const result = await restrictQuery(formatted, memberId);

        res.json(result);
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: "Internal server error." });
    }
}


const liftRestriction = async (req, res) => {
    const { memberId, memberName, email } = req.body;

    try {
        db.query('UPDATE member_i SET member_restrict = null WHERE member_id = ?', [memberId], (err, result) => {
            if (err) {
                console.log("restrict error: ", err);
            }

            if (result.affectedRows > 0 ){
                axios.post(`${process.env.EMAIL_DOMAIN}/admin/uplift`, {
                    receiver: email,
                    memberName: memberName
                });
                res.json({message: "lift restriction success"});
            } else {
                res.json({message: "Lift Restriction not successful"});
                
            }
        })
    } catch (error) {
        console.log("liftRestriction Error: ", error);
    }
}

const recoverMember = async (req, res) => {
    const { memberId, memberName, email } = req.body;

    try {
        db.query('UPDATE member_i SET member_flag = 1 WHERE member_id = ?', [memberId], (err, result) => {
            if (err) {
                console.log("restrict error: ", err);
            }

            if (result.affectedRows > 0 ){
                axios.post(`${process.env.EMAIL_DOMAIN}/admin/recover`, {
                    receiver: email,
                    memberName: memberName
                });
                res.json({message: "Account Recovery Success"});
            } else {
                res.json({message: "Account Recovery Failed"});
                
            }
        })
    } catch (error) {
        console.log("liftRestriction Error: ", error);
    }
}

const restrictQuery = async (validity, memberId) => {
    try {
        return new Promise((resolve, reject) => {
            db.query('UPDATE member_i SET member_restrict = ? WHERE member_id = ?', [validity, memberId], (err, result) => {
                if (err) {
                    console.error("restrict error: ", err);
                    reject({ result: "Restriction on Member Failed" });
                    return;
                }

                if (result.affectedRows > 0) {
                    resolve({ result: "Restriction on Member Success!" });
                } else {
                    console.error("Restrict Query not successful");
                    reject({ result: "Restriction on Member Failed" });
                }
            });
        });
    } catch (error) {
        console.error("restrictQuery Error: ", error);
        throw error;
    }
}

const removeMember = async (memberId) => {
    return new Promise((resolve, reject) => {
        try {
            db.query('UPDATE member_i SET member_flag = 0, member_restrict = null WHERE member_id = ?', [memberId], (err, result) => {
                if (err) {
                    console.error("removeMember query error: ", err);
                    reject({ success: false, message: "An error occurred while removing member." });
                    return;
                }

                if (result.affectedRows > 0) {
                    resolve({ success: true, message: "Member removed successfully." });
                } else {
                    console.log("Remove Member Query not successful");
                    resolve({ success: false, message: "Member not found or already removed." });
                }
            });
        } catch (error) {
            console.error("removeMember Error: ", error);
            reject({ success: false, message: "An error occurred while removing member." });
        }
    });
}


module.exports = {
    restrictMember,
    liftRestriction,
    recoverMember
}