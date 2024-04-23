const db = require('../../database/db');


const updateMemberStat = async (member_type) => {
	return new Promise((resolve, reject) => {
		const currentDate = new Date();
		let currentYear = currentDate.getFullYear();
		let currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
		let currentDay = String(currentDate.getDate()).padStart(2, '0');
		let currentFormattedDate = `${currentYear}-${currentMonth}-${currentDay}`;

		const checkContentStatDateQuery = `
			 SELECT * FROM member_stat WHERE
			 stat_date = ? AND member_type = ?
		`;
		db.query(checkContentStatDateQuery, [currentFormattedDate, member_type], (checkError, checkResult) => {
			if (checkError) reject(checkError);
			else if (checkResult.length > 0) {
				const updateContentStatQuery = `
					UPDATE member_stat SET
					member_count = member_count + 1
					WHERE stat_date = ? AND member_type = ?
			  `;
				db.query(updateContentStatQuery, [currentFormattedDate, member_type], (updateError, updateResult) => {
					if (updateError) reject(updateError);
					else resolve(updateResult);
				});
                console.log("statUpdater: member updated");
			}
			else {
				const createContentStatQuery = `
					INSERT INTO member_stat (
						stat_date, member_type, member_count
					)
					VALUES (NOW(), ?, 1)
			  `;
				db.query(createContentStatQuery, member_type, (createError, createResult) => {
					if (createError) reject(createError);
					else resolve(createResult);
				});
                console.log("statUpdater: member inserted");
			}
		});
	});
}

module.exports = {
    updateMemberStat    
}