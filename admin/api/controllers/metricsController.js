const db = require('../../database/db')

const countField = (field_name) => {
    return new Promise((resolve, reject) => {
        db.query(
            `SELECT COUNT(${field_name}_id) as count FROM ${field_name}_i WHERE ${field_name}_flag = 1`,
            (err, data) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(data[0].count)
                }
            }
        )
    })
}

const countEmailSubscriber = () => {
    return new Promise((resolve, reject) => {
        db.query(
            'SELECT COUNT(email_id) as count FROM `email_i` WHERE email_subscribe = 1',
            (err, data) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(data[0].count)
                }
            }
        )
    })
}
const countMemberByType = (type) => {
    return new Promise((resolve, reject) => {
        db.query(
            'SELECT COUNT(member_id) as count FROM `member_i` WHERE member_type = ? AND member_flag = 1',
            [type],
            (err, data) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(data[0].count)
                }
            }
        )
    })
}
const countPending = (type) => {
    return new Promise((resolve, reject) => {
        db.query(
            `SELECT COUNT(${type}_id) as count FROM ${type}_i WHERE ${type}_approval = 0 AND ${type}_flag = 1`,
            (err, data) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(data[0].count)
                }
            }
        )
    })
}

/*
 *
 *
 *
 */

const getContents = async (req, res) => {
    try {
        let count = 0
        const blogs = await countField('blog')
        const posts = await countField('post')
        const events = await countField('event')
        const program = await countField('program')

        count = blogs + posts + events + program

        return res.status(200).json(count)
        // if (result.length > 0) {
        //     return res.status(200).json({ result: result })
        // } else {
        //     return res.status(404).json({ result: null })
        // }
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}
const getMembers = async (req, res) => {
    try {
        const members = await countField('member')

        return res.status(200).json(members)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}
const getNewsletterSubscriber = async (req, res) => {
    try {
        const members = await countEmailSubscriber()

        return res.status(200).json(members)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

const getEnablers = async (req, res) => {
    try {
        const members = await countMemberByType(2)

        return res.status(200).json(members)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

const getCompanies = async (req, res) => {
    try {
        const members = await countMemberByType(1)

        return res.status(200).json(members)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

const getPendingPosts = async (req, res) => {
    try {
        const members = await countPending('post')

        return res.status(200).json(members)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}
const getPendingMembers = async (req, res) => {
    try {
        const count = await new Promise((resolve, reject) => {
            db.query(
                `SELECT COUNT(app_id) as count FROM application_i`,
                (err, data) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(data[0].count)
                    }
                }
            )
        })

        // console.log(count)
        return res.status(200).json(count)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

const getRecentActivities = async (req, res) => {
    try {
        const count = await new Promise((resolve, reject) => {
            db.query(
                `SELECT *
                FROM history_i
                ORDER BY history_datecreated DESC
                LIMIT 4;`,
                (err, data) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(data)
                    }
                }
            )
        })

        console.log(count)
        return res.status(200).json(count)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

module.exports = {
    getContents,
    getMembers,
    getNewsletterSubscriber,
    getEnablers,
    getCompanies,
    getPendingPosts,
    getPendingMembers,
    getRecentActivities,
}
