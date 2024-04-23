const db = require('../../database/db');

const searchBlog = async (req, res) => {
    const { search_term } = req.body;

    try {
        db.query("SELECT blog_i.*, setting_institution FROM blog_i INNER JOIN member_settings ON blog_i.blog_author = member_settings.setting_memberId WHERE (setting_institution LIKE ? OR blog_title LIKE ?) AND blog_flag = 1", [`%${search_term}%`, `%${search_term}%`], (searchError, searchResult) => {
            if (searchError) {
                console.error('Error executing MySQL query:', searchError);
                res.status(500).json({ error: 'Error executing MySQL query' });
            } else {
                res.json(searchResult);
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const searchCompanyBlogs = async (req, res) => {
    const { search_term } = req.body;

    try {
        db.query("SELECT blog_i.*, member_type, setting_institution FROM blog_i INNER JOIN member_settings ON blog_i.blog_author = member_settings.setting_memberId INNER JOIN member_i ON blog_i.blog_author = member_i.member_id WHERE (setting_institution LIKE ? OR blog_title LIKE ?) AND member_type = 1 AND blog_flag = 1", [`%${search_term}%`, `%${search_term}%`], (searchError, searchResult) => {
            if (searchError) {
                console.error('Error executing MySQL query:', searchError);
                res.status(500).json({ error: 'Error executing MySQL query' });
            } else {
                res.json(searchResult);
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const searchEnablerBlogs = async (req, res) => {
    const { search_term } = req.body;

    try {
        db.query("SELECT blog_i.*, member_type, setting_institution FROM blog_i INNER JOIN member_settings ON blog_i.blog_author = member_settings.setting_memberId INNER JOIN member_i ON blog_i.blog_author = member_i.member_id WHERE (setting_institution LIKE ? OR blog_title LIKE ?) AND member_type = 2 AND blog_flag = 1", [`%${search_term}%`, `%${search_term}%`], (searchError, searchResult) => {
            if (searchError) {
                console.error('Error executing MySQL query:', searchError);
                res.status(500).json({ error: 'Error executing MySQL query' });
            } else {
                res.json(searchResult);
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


const searchEvent = async (req, res) => {
    const { search_term } = req.body;

    try {
        db.query("SELECT event_i.*, setting_institution FROM event_i INNER JOIN member_settings ON event_i.event_author = member_settings.setting_memberId WHERE setting_institution LIKE ? OR event_title LIKE ? OR event_address LIKE ? AND event_flag = 1", [`%${search_term}%`, `%${search_term}%`, `%${search_term}%`], (searchError, searchResult) => {
            if (searchError) {
                console.error('Error executing MySQL query:', searchError);
                res.status(500).json({ error: 'Error executing MySQL query' });
            } else {
                res.json(searchResult);
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const searchGuides = async (req, res) => {
    const { search_term } = req.body;

    try {
        db.query("SELECT program_i.*, setting_institution FROM program_i INNER JOIN member_settings ON program_i.program_author = member_settings.setting_memberId WHERE setting_institution LIKE ? OR program_heading LIKE ? AND program_flag = 1", [`%${search_term}%`, `%${search_term}%`], (searchError, searchResult) => {
            if (searchError) {
                console.error('Error executing MySQL query:', searchError);
                res.status(500).json({ error: 'Error executing MySQL query' });
            } else {
                res.json(searchResult);
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    searchBlog,
    searchCompanyBlogs,
    searchEnablerBlogs,
    searchEvent,
    searchGuides
}