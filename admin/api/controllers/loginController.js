const db = require('../../database/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const hash = require('sha256');

// Reusable function to authenticate user and generate token
const authenticateUser = async (accessKey, password) => {
    // Ensure accessKey is provided and not falsy
    if (!accessKey) {
        return Promise.resolve({ error: 'Access key is required' });
    }

    const hashedAccesskey = hash(accessKey).toString('base64');

    return new Promise((resolve, reject) => {
        try {    
            db.query(
                `SELECT * FROM admin_i WHERE admin_accessKey = ?`,
                [hashedAccesskey],
                async (err, result) => {
                    if (err) {
                        reject({ error: 'Internal server error' });
                    }

                    if (!result[0].hasOwnProperty('admin_pass')) {
                        resolve({ error: 'User not found' });
                    }

                    const DBpassword = result[0].admin_pass;

                    if (!DBpassword) {
                        resolve({ error: 'User password not found' });
                    }

                    const passwordMatch = await bcrypt.compare(password, DBpassword);

                    if (passwordMatch) {
                        const user = result[0];

                        const token = jwt.sign(
                            { userId: user.account_id, username: user.name },
                            process.env.JWT_SECRET_KEY,
                            { expiresIn: '1h' }
                        );
                        
                        resolve({ token });
                    } else {
                        resolve({ error: 'Authentication failed' });
                    }
                }
            );
        } catch (error) {
            console.log(error);
        }
    });
};


// Controller to handle login request
const loginController = async (req, res) => {
    const { accessKey, password } = req.body;

    try {
        // Destroy accesskey when logged out or by default
        const result = await authenticateUser(accessKey, password);
        if (result.error) {
            return res.status(401).json(result);
        }
        return res.json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = loginController;
