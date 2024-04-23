const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const bcryptConverter = (string) => {
  return new Promise((resolve, reject) => {
    // Generate a salt
    const saltRounds = process.env.BCRYPT_SALT_ROUNDS;

    bcrypt.genSalt(parseInt(saltRounds), (err, salt) => {
      if (err) {
        reject(err);
      }

      // Hash the string with the generated salt
      bcrypt.hash(string, salt, (err, hash) => {
        if (err) {
          reject(err);
        }

        // Resolve the promise with the hashed value
        resolve(hash);
      });
    });
  });
};

module.exports = bcryptConverter;
