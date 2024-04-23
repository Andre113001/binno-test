const db = require('../../database/db');
const moment = require('moment-timezone');

moment.tz.setDefault("Asia/Manila");

const getStatByWeek = async (contentType) => {
    try {
        const res = await new Promise((resolve, reject) => {
            db.query(`SELECT SUM(stat_count) AS total
            FROM (
                SELECT 
                dates.d AS stat_date,
                COALESCE(ns.stat_count, 0) AS stat_count
                FROM 
                (SELECT CURRENT_DATE - INTERVAL (a.a + (10 * b.a)) DAY AS d
                    FROM 
                        (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) AS a
                        CROSS JOIN 
                        (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) AS b
                ) AS dates
                    LEFT JOIN content_stat ns ON dates.d = ns.stat_date
                    WHERE content_type = ?
                    AND dates.d >= DATE_SUB(CURRENT_DATE, INTERVAL 1 WEEK) AND dates.d <= CURRENT_DATE
                ) AS subquery`, [contentType], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        const res1 = await new Promise ((resolve, reject) => {
            db.query(`SELECT 
            DATE_SUB(CURRENT_DATE, INTERVAL t.a DAY) AS stat_date,
            COALESCE(ns.stat_count, 0) AS stat_count
        FROM 
            (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) AS t
        LEFT JOIN content_stat ns ON DATE_SUB(CURRENT_DATE, INTERVAL t.a DAY) = ns.stat_date AND ns.content_type = ?
        WHERE DATE_SUB(CURRENT_DATE, INTERVAL t.a DAY) >= DATE_SUB(CURRENT_DATE, INTERVAL 6 DAY) AND DATE_SUB(CURRENT_DATE, INTERVAL t.a DAY) <= CURRENT_DATE
        ORDER BY stat_date;
        `, [contentType], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        })

        const total = res[0][`total`];
        const total_stat_count = res1;

        const response = {
            total,
            total_stat_count
        };

        return response;
    } catch (error) {
        console.error(error);
    } 
}

const getStatByMonth = async (contentType) => {
    const month = moment().format('M');
    const year = moment().format('YYYY');
    try {
        const res = await new Promise((resolve, reject) => {
            db.query(`SELECT SUM(stat_count) AS total
            FROM content_stat
            WHERE content_type = ?
            AND YEAR(stat_date) = YEAR(CURRENT_DATE)
            AND MONTH(stat_date) = MONTH(CURRENT_DATE)`, [contentType], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        
        const res1 = await new Promise ((resolve, reject) => {
            db.query(`SELECT 
            dates.d AS stat_date,
            COALESCE(ns.stat_count, 0) AS stat_count
        FROM 
            (SELECT DATE_FORMAT('${year}-${month}-01', '%Y-%m-01') + INTERVAL (a.a + (10 * b.a) + (100 * c.a)) DAY AS d
                FROM (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS a
                CROSS JOIN (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS b
                CROSS JOIN (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS c
            ) AS dates
        LEFT JOIN content_stat ns ON dates.d = ns.stat_date
        WHERE 
            content_type  = ?
            AND MONTH(dates.d) = ${month} AND YEAR(dates.d) = ${year}
        ORDER BY dates.d;`, [contentType], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        })

        const total = res[0][`total`];
        const total_stat_count = res1;

        const response = {
            total,
            total_stat_count
        };

        return response;
    } catch (error) {
        console.error(error);
    } 
};


const getStatByYear = async (contentType) => {
    const year = moment().format('YYYY');

    try {
        const res = await new Promise((resolve, reject) => {
            db.query(`SELECT SUM(stat_count) AS total
            FROM content_stat
            WHERE content_type = ?
            AND YEAR(stat_date) = YEAR(CURRENT_DATE)`, [contentType], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        const res1 = await new Promise((resolve, reject) => {
            db.query(`SELECT 
                months.month,
                COALESCE(SUM(ns.stat_count), 0) AS stat_count
            FROM 
                (SELECT ${year} AS year, month
                FROM (SELECT 1 AS month UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12) AS m
                ) AS months
            LEFT JOIN content_stat ns 
                ON YEAR(ns.stat_date) = months.year AND MONTH(ns.stat_date) = months.month AND ns.content_type = ?
            GROUP BY 
                months.year, months.month
            ORDER BY 
                months.year, months.month;
                `, [contentType], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        const total = res[0][`total`];
        const total_stat_count = res1;

        const response = {
            total,
            total_stat_count
        };

        return response;
    } catch (error) {
        console.error(error);
    } 
};

const getEmailStat = async (range) => {
    let sql, dates;
    const month = moment().format('M');
    const year = moment().format('YYYY');

    switch (range) {
        case 1:
            sql = `SELECT 
            SUM(subscriber_count) AS total_subscribers
        FROM (
            SELECT 
                dates.d AS stat_date,
                COALESCE(ns.subscriber_count, 0) AS subscriber_count
            FROM 
                (SELECT CURRENT_DATE - INTERVAL (a.a + (10 * b.a)) DAY AS d
                    FROM 
                        (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) AS a
                        CROSS JOIN 
                        (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) AS b
                ) AS dates
            LEFT JOIN newsletter_stat ns ON dates.d = ns.stat_date
            WHERE dates.d >= DATE_SUB(CURRENT_DATE, INTERVAL 1 WEEK) AND dates.d <= CURRENT_DATE
        ) AS subquery;
        `;

            dates = `SELECT 
            dates.d AS stat_date,
            COALESCE(ns.subscriber_count, 0) AS subscriber_count
        FROM 
            (SELECT CURRENT_DATE - INTERVAL (a.a + (10 * b.a)) DAY AS d
                FROM 
                    (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) AS a
                    CROSS JOIN 
                    (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) AS b
            ) AS dates
        LEFT JOIN newsletter_stat ns ON dates.d = ns.stat_date
        WHERE dates.d >= DATE_SUB(CURRENT_DATE, INTERVAL 1 WEEK) AND dates.d <= CURRENT_DATE
        ORDER BY dates.d;
        `
            break;
        case 2:
            sql = `SELECT SUM(subscriber_count) AS total_subscribers
            FROM newsletter_stat
            WHERE YEAR(stat_date) = YEAR(CURRENT_DATE)
            AND MONTH(stat_date) = MONTH(CURRENT_DATE)`;


            dates = `SELECT 
            dates.d AS stat_date,
            COALESCE(ns.subscriber_count, 0) AS subscriber_count
        FROM 
            (SELECT DATE_FORMAT('2024-${month}-01', '%Y-%m-01') + INTERVAL (a.a + (10 * b.a) + (100 * c.a)) DAY AS d
                FROM (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS a
                CROSS JOIN (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS b
                CROSS JOIN (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS c
            ) AS dates
        LEFT JOIN newsletter_stat ns ON dates.d = ns.stat_date
        WHERE 
            MONTH(dates.d) = ${month} AND YEAR(dates.d) = ${year}
        ORDER BY dates.d;`;

            break;
        case 3:
            sql = `SELECT SUM(subscriber_count) AS total_subscribers
            FROM newsletter_stat
            WHERE YEAR(stat_date) = YEAR(CURRENT_DATE)`;

            dates = `SELECT 
                    months.month,
                    COALESCE(SUM(ns.subscriber_count), 0) AS subscriber_count
                FROM 
                    (SELECT ${year} AS year, month
                    FROM (SELECT 1 AS month UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12) AS m
                    ) AS months
                LEFT JOIN newsletter_stat ns 
                    ON YEAR(ns.stat_date) = months.year AND MONTH(ns.stat_date) = months.month
                GROUP BY months.year, months.month
                ORDER BY months.year, months.month;
                    `
            break;
        default:
            break;
    }

    try {
        const res = await new Promise((resolve, reject) => {
            db.query(sql, [], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })
        })

        const res1 = await new Promise((resolve, reject) => {
            db.query(dates, [], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })
        })

        const total_subscriber = res[0].total_subscribers;
        const total_stat_count = res1;

        const response = {
            total_subscriber,
            total_stat_count,
        };

        return response;
    } catch (error) {
        console.error(error);
    }
};


const getMembersStat = async (range) => {
    let sql, dates;
    switch (range) {
        case 1:
            enablersTotal = `SELECT 
            SUM(member_count) AS total_enablers
        FROM (
            SELECT 
                dates.d AS stat_date,
                COALESCE(ns.member_count, 0) AS member_count
            FROM 
                (SELECT CURRENT_DATE - INTERVAL (a.a + (10 * b.a)) DAY AS d
                    FROM 
                        (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) AS a
                        CROSS JOIN 
                        (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) AS b
                ) AS dates
            LEFT JOIN member_stat ns ON dates.d = ns.stat_date
            WHERE member_type = "Enabler"
            AND dates.d >= DATE_SUB(CURRENT_DATE, INTERVAL 1 WEEK) AND dates.d <= CURRENT_DATE
        ) AS subquery;`;

            companiesTotal = `SELECT 
            SUM(member_count) AS total_companies
        FROM (
            SELECT 
                dates.d AS stat_date,
                COALESCE(ns.member_count, 0) AS member_count
            FROM 
                (SELECT CURRENT_DATE - INTERVAL (a.a + (10 * b.a)) DAY AS d
                    FROM 
                        (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) AS a
                        CROSS JOIN 
                        (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) AS b
                ) AS dates
            LEFT JOIN member_stat ns ON dates.d = ns.stat_date
            WHERE member_type = "Company"
            AND dates.d >= DATE_SUB(CURRENT_DATE, INTERVAL 1 WEEK) AND dates.d <= CURRENT_DATE
        ) AS subquery;`

            recentCompanies = `SELECT member_id, member_datecreated, setting_institution, setting_profilepic, setting_address 
            FROM member_settings 
            INNER JOIN member_i ON member_i.member_setting = member_settings.setting_id 
            WHERE member_type = 1
            AND setting_datecreated >= DATE_SUB(CURRENT_DATE, INTERVAL 1 WEEK) 
            ORDER BY member_datecreated DESC 
            LIMIT 3;`

            recentEnablers = `SELECT member_id, member_datecreated, setting_institution, setting_profilepic, setting_address 
            FROM member_settings 
            INNER JOIN member_i ON member_i.member_setting = member_settings.setting_id 
            WHERE member_type = 2
            AND setting_datecreated >= DATE_SUB(CURRENT_DATE, INTERVAL 1 WEEK) 
            ORDER BY member_datecreated DESC 
            LIMIT 3;`

            // dates = `SELECT *
            // FROM member_stat
            // WHERE stat_date >= DATE_SUB(CURRENT_DATE, INTERVAL 1 WEEK)
            // AND stat_date <= CURRENT_DATE`
            break;
        case 2:
            enablersTotal = `SELECT SUM(member_count) AS total_enablers
            FROM member_stat
            WHERE member_type = "Enabler"
            AND YEAR(stat_date) = YEAR(CURRENT_DATE)
            AND MONTH(stat_date) = MONTH(CURRENT_DATE)`;

            companiesTotal = `SELECT SUM(member_count) AS total_companies
            FROM member_stat
            WHERE member_type = "Company"
            AND YEAR(stat_date) = YEAR(CURRENT_DATE)
            AND MONTH(stat_date) = MONTH(CURRENT_DATE)`;

            recentCompanies = `SELECT member_id, setting_institution, setting_profilepic, setting_address FROM member_settings 
            INNER JOIN member_i ON member_i.member_setting = member_settings.setting_id 
            WHERE member_type = 1 
            AND YEAR(setting_datecreated) = YEAR(CURRENT_DATE)
            AND MONTH(setting_datecreated) = MONTH(CURRENT_DATE) LIMIT 3;`

            recentEnablers = `SELECT member_id, setting_institution, setting_profilepic, setting_address FROM member_settings 
            INNER JOIN member_i ON member_i.member_setting = member_settings.setting_id 
            WHERE member_type = 2 
            AND YEAR(setting_datecreated) = YEAR(CURRENT_DATE)
            AND MONTH(setting_datecreated) = MONTH(CURRENT_DATE) LIMIT 3;`

            // dates = `SELECT *
            // FROM member_stat
            // WHERE YEAR(stat_date) = YEAR(CURRENT_DATE)
            // AND MONTH(stat_date) = MONTH(CURRENT_DATE)`
            break;
        case 3:
            enablersTotal = `SELECT SUM(member_count) AS total_enablers
            FROM member_stat
            WHERE member_type = "Enabler"
            AND YEAR(stat_date) = YEAR(CURRENT_DATE)`;

            companiesTotal = `SELECT SUM(member_count) AS total_companies
            FROM member_stat
            WHERE member_type = "Company"
            AND YEAR(stat_date) = YEAR(CURRENT_DATE)`;

            recentCompanies = `SELECT member_id, setting_institution, setting_profilepic, setting_address FROM member_settings 
            INNER JOIN member_i ON member_i.member_setting = member_settings.setting_id 
            WHERE member_type = 1 
            AND YEAR(setting_datecreated) = YEAR(CURRENT_DATE) LIMIT 3;`

            recentEnablers = `SELECT member_id, setting_institution, setting_profilepic, setting_address FROM member_settings 
            INNER JOIN member_i ON member_i.member_setting = member_settings.setting_id 
            WHERE member_type = 2 
            AND YEAR(setting_datecreated) = YEAR(CURRENT_DATE) LIMIT 3;`

            // dates = `SELECT YEAR(stat_date) AS year,
            //                 MONTH(stat_date) AS month,
            //                 SUM(member_count) AS total_members
            //         FROM member_stat
            //         WHERE YEAR(stat_date) = YEAR(CURRENT_DATE)
            //         GROUP BY YEAR(stat_date), MONTH(stat_date);
            //         `ode .
            
            break;
        default:
            break;
    }

    try {
        const res = await new Promise((resolve, reject) => {
            db.query(enablersTotal, [], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })
        })

        const res1 = await new Promise((resolve, reject) => {
            db.query(companiesTotal, [], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })
        })

        const res2 = await new Promise((resolve, reject) => {
            db.query(recentCompanies, [], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })
        })

        const res3 = await new Promise((resolve, reject) => {
            db.query(recentEnablers, [], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })
        });

        const count_enablers = res[0].total_enablers;
        const count_company = res1[0].total_companies;
        const recent_companies = res2;
        const recent_enablers = res3;

        const response = {
            count_enablers,
            count_company,
            recent_companies,
            recent_enablers
        };

        return response;
    } catch (error) {
        console.error(error);
    }
};

const fetchStats = async (req, res) => {
    const { range } = req.body;
    let blogStat, postStat, eventStat, guideStat, newsletterStat, memberStat;

    switch (range) {
        case "This Week":
            blogStat = await getStatByWeek('blog');
            postStat = await getStatByWeek('post');
            eventStat = await getStatByWeek('event');
            guideStat = await getStatByWeek('guide');
            newsletterStat = await getEmailStat(1);
            memberStat = await getMembersStat(1);
            break;
        case "This Month":
            blogStat = await getStatByMonth('blog');
            postStat = await getStatByMonth('post');
            eventStat = await getStatByMonth('event');
            guideStat = await getStatByMonth('guide');
            newsletterStat = await getEmailStat(2);
            memberStat = await getMembersStat(2);
            break;
        case "This Year":
            blogStat = await getStatByYear('blog');
            postStat = await getStatByYear('post');
            eventStat = await getStatByYear('event');
            guideStat = await getStatByYear('guide');
            newsletterStat = await getEmailStat(3);
            memberStat = await getMembersStat(3);
            break;
        default:
            console.log("INVALID RANGE");
            break;
    }

    return res.status(200).json({
        blogStat: blogStat,
        postStat: postStat,
        eventStat: eventStat,
        guideStat: guideStat,
        newsletterStat: newsletterStat,
        memberStat: memberStat
    })


}

module.exports = {
    fetchStats
}