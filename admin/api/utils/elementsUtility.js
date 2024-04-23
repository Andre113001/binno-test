const fs = require('fs').promises; // Use the promises version of fs
const dotenv = require('dotenv')

dotenv.config()

const readElements = async (fileId) => {
    try {
        // Read the JSON file
        const data = await fs.readFile(`${process.env.ELEMENT_LOC}${fileId}.json`, 'utf8');
        
        // Parse the JSON data
        const jsonData = JSON.parse(data);
        console.log(jsonData);
        
        // Now you can work with the parsed JSON data
        return jsonData;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

const saveElements = async (fileId, newFile) => {
    try {
        const filePath = `${process.env.ELEMENT_LOC}${fileId}.json`;

        // Write the updated data to the file
        await fs.writeFile(filePath, JSON.stringify(newFile, null, 2));

        return { success: true, message: 'Elements saved successfully' };
    } catch (error) {
        console.error('Error saving elements:', error);
        return { success: false, error: 'Internal Server Error' };
    }
}

module.exports = { readElements, saveElements };
