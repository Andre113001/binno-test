const db = require('../../database/db');
const uniqueId = require('./uniqueIdGeneratorMiddleware'); // Adjust the path accordingly

const uploadToLog = async (authorId, contentId, username, action, type, title) => {
  return new Promise((resolve, reject) => {
    const newHistoryId = uniqueId.uniqueIdGenerator();

    db.query(
      'INSERT INTO history_i (history_id, history_datecreated, history_author, history_reference, history_text) VALUES (?, NOW(), ?, ?, ?)',
      [newHistoryId, authorId, contentId, `${username} ${action} ${type}: '${title}'`], (err, result) => {
        if (err) {
          console.error(err);
          reject(false);
        } else if (result.affectedRows > 0) {
        //   console.log(`History uploaded to id ${newHistoryId}`);
          resolve(true);
        } else {
          console.error('Failed to insert into the database.');
          resolve(false);
        }
      }
    );
  });
};

module.exports = {
    uploadToLog
};
