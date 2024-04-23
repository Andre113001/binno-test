const mysql = require('mysql2')
const dotenv = require('dotenv')

dotenv.config()

const db = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB,
    insecureAuth: true, // Add this line to use older authentication method
})

db.connect((err) => {
    if (err) {
        console.log({
            host: process.env.MYSQL_HOST,
            port: process.env.MYSQL_PORT,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASS,
            database: process.env.MYSQL_DB,
        })
        console.error('Error connecting to MySQL:', err)
    } else {
        console.log(`======================================`)
        console.log('Connected to MySQL database')
        console.log(`======================================`)
    }
})

module.exports = db
