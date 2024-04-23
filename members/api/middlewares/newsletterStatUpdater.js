const db = require('../../database/db');


const updateEmailStat = async () => {
	return new Promise((resolve, reject) => {
		const currentDate = new Date();
		let currentYear = currentDate.getFullYear();
		let currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
		let currentDay = String(currentDate.getDate()).padStart(2, '0');
		let currentFormattedDate = `${currentYear}-${currentMonth}-${currentDay}`;

		const checkContentStatDateQuery = `
			 SELECT * FROM newsletter_stat WHERE
			 stat_date = ?
		`;
		db.query(checkContentStatDateQuery, [currentFormattedDate], (checkError, checkResult) => {
			if (checkError) reject(checkError);
			else if (checkResult.length > 0) {
				const updateContentStatQuery = `
					UPDATE newsletter_stat SET
					subscriber_count = subscriber_count + 1
					WHERE stat_date = ?
			  `;
				db.query(updateContentStatQuery, [currentFormattedDate], (updateError, updateResult) => {
					if (updateError) reject(updateError);
					else resolve(updateResult);
				});
                // console.log("statUpdater: email updated");
			}
			else {
				const createContentStatQuery = `
					INSERT INTO newsletter_stat (
						stat_date, subscriber_count
					)
					VALUES (NOW(), 1)
			  `;
				db.query(createContentStatQuery, [], (createError, createResult) => {
					if (createError) reject(createError);
					else resolve(createResult);
				});
                // console.log("statUpdater: email inserted");
			}
		});
	});
}

module.exports = {
    updateEmailStat
}