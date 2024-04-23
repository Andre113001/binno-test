const db = require('../../database/db');

/**
* Create or Update a Content Stat based on the current date and the type of content
* @param {string} content_type - should be "blog", "guide", "post", or "event"
* @returns {Promise<Array>} A Promise that resolves to an array containing the update or create result or rejects with an error.
*/
const updateContentStat = async (content_type) => {
	return new Promise((resolve, reject) => {
		const currentDate = new Date();
		let currentYear = currentDate.getFullYear();
		let currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
		let currentDay = String(currentDate.getDate()).padStart(2, '0');
		let currentFormattedDate = `${currentYear}-${currentMonth}-${currentDay}`;

		const checkContentStatDateQuery = `
			 SELECT * FROM content_stat WHERE
			 stat_date = ? AND content_type = ?
		`;
		db.query(checkContentStatDateQuery, [currentFormattedDate, content_type], (checkError, checkResult) => {
			if (checkError) reject(checkError);
			else if (checkResult.length > 0) {
				const updateContentStatQuery = `
					UPDATE content_stat SET
					stat_count = stat_count + 1
					WHERE stat_date = ? AND content_type = ?
			  `;
				db.query(updateContentStatQuery, [currentFormattedDate, content_type], (updateError, updateResult) => {
					if (updateError) reject(updateError);
					else resolve(updateResult);
				});

				// console.log('content stat updater: update');
			}
			else {
				const createContentStatQuery = `
					INSERT INTO content_stat (
						 content_type, stat_date, stat_count
					)
					VALUES (?, NOW(), 1)
			  `;
				db.query(createContentStatQuery, content_type, (createError, createResult) => {
					if (createError) reject(createError);
					else resolve(createResult);
				});
				// console.log('content stat updater: insert');
			}
		});
	});
}

/**
* Deduct a Content Stat based on the current date and the type of content
* @param {date} stat_date - date of the content to be deducted
* @param {string} content_type - should be "blog", "guide", "post", or "event"
* @returns {Promise<Array>} A Promise that resolves to an array containing the deduction result or rejects with an error.
*/
const deductContentStat = async (stat_date, content_type) => {
	return new Promise((resolve, reject) => {
		const checkContentStatDateQuery = `
			 SELECT * FROM content_stat WHERE
			 stat_date = ? AND content_type = ?
		`;
		db.query(checkContentStatDateQuery, [stat_date, content_type], (checkError, checkResult) => {
			if (checkError) {
				console.error(checkError);
				reject(checkError);
			}
			else if (checkResult.length > 0) {
				const deductContentStatQuery = `
					UPDATE content_stat SET
					stat_count = stat_count - 1
					WHERE stat_date = ? AND content_type = ?
				`;
				db.query(deductContentStatQuery, [stat_date, content_type], (deductError, deductResult) => {
					if (deductError) {
						console.error(deductError);
						reject(deductError);
					}
					else resolve(deductResult);
				});
			}
		})
	});
}

module.exports = {
	updateContentStat,
	deductContentStat
};
