const { default: axios } = require('axios')
const db = require('../../database/db')
const fs = require('fs')
const path = require('path')

//Middlewares
const sanitizeId = require('../middlewares/querySanitizerMiddleware')
const uniqueId = require('../middlewares/uniqueIdGeneratorMiddleware')
const { uploadToLog } = require('../middlewares/activityLogger');
const { updateContentStat } = require('../middlewares/contentStatUpdater');

const blog = async (req, res) => {
    try {
        db.query("SELECT blog_i.* FROM blog_i INNER JOIN member_i ON blog_i.blog_author = member_i.member_id WHERE blog_flag = 1 AND member_restrict IS NULL AND member_flag = 1", [], (err, result) => {
            if (err) {
                return res.status(500).json(err)
            }

            if (result.length > 0) {
                return res.status(200).json(result)
            } else {
                return res.status(500).json(err)
            }
        })
    } catch (error) {
        return res.status(500).json(error)
    }
}

// Reusable function to get a blog by ID
const getBlogById = async (blogId) => {
    return new Promise((resolve, reject) => {
        db.query(
            'SELECT blog_i.* FROM blog_i INNER JOIN member_i ON blog_i.blog_author = member_i.member_id WHERE blog_id = ? AND blog_flag = 1 AND member_restrict IS NULL AND member_flag = 1',
            [blogId],
            (err, result) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            }
        )
    })
}

// Controller to get a blog by ID
const getBlog = async (req, res) => {
    const { blogId } = req.params
    try {
        const result = await getBlogById(blogId)
        if (result.length > 0) {
            const blog = result[0]

            const blog_pic_path = path.join(
                __dirname,
                '../../public/img/blog-pics',
                blog.blog_img
            )

            // Assuming your image file has the same name as the blog ID with an extension
            // const blog_pic_path = `/static/img/blog-pics/${blog.blog_img}`;

            // Add the imageURL to your response
            return res.json({ ...blog, blog_pic_path })
        } else {
            return res.status(500).json({ error: 'Blog does not exist' })
        }
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

const getImageBlob = (imagePath) => {
    return fs.readFileSync(imagePath)
}

const getBlogImage = async (req, res) => {
    const { blogId } = req.params

    db.query(
        'SELECT blog_img FROM blog_i WHERE blog_id = ?',
        [blogId],
        (err, result) => {
            if (err) {
                return res.status(500).json(err)
            }

            if (result.length > 0) {
                const imgPath = path.join(
                    __dirname,
                    '../../public/img/blog-pics',
                    result[0].blog_img
                )
                try {
                    const imageBlob = getImageBlob(imgPath)

                    // Set the appropriate content type for the image
                    res.setHeader('Content-Type', 'image/jpeg') // Adjust the content type based on your image format

                    // Send the image binary data as the response
                    res.send(imageBlob)
                } catch (error) {
                    console.error('Error fetching image:', error)
                    res.status(500).send('Internal Server Error')
                }
            } else {
                return res.status(500).json(err)
            }
        }
    )
}

const fetchAllBlogs = async (req, res) => {
    const { userId } = req.params

    try {
        db.query(
            `SELECT blog_i.*, member_settings.setting_institution
            FROM blog_i
            INNER JOIN member_i ON blog_i.blog_author = member_i.member_id
            INNER JOIN member_settings ON member_i.member_setting = member_settings.setting_id
            WHERE blog_i.blog_author = ? AND blog_i.blog_flag = 1
            ORDER BY blog_dateadded DESC`,
            [userId],
            (blogError, blogRes) => {
                if (blogError) {
                    console.log(blogError)
                    return res
                        .status(500)
                        .json({ error: 'Failed to fetch blogs', blogError })
                } else {
                    return res.status(200).json(blogRes)
                }
            }
        )
    } catch (error) {
        res.status(500).json({ error })
    }
}

function limitWords(text, limit) {
    const words = text.split(' ')
    const limitedWords = words.slice(0, limit)
    return limitedWords.join(' ')
}

function getFileExtensionFromDataURL(dataURL) {
    const match = dataURL.match(/^data:image\/([a-zA-Z+]+);base64,/);
    if (match && match[1]) {
        return match[1];
    }
    return null;
}

const postBlog = async (req, res) => {
    const {
        blogId,
        authorId,
        blogTitle,
        blogContent,
        blogImg,
        username
    } = req.body

    try {
        const result = await getBlogById(blogId);

        if (result.length > 0) {
            const OldimageId = path.basename(result[0].blog_img, path.extname(result[0].blog_img));
            let currentImg = result[0].blog_img;
            // Delete the old image file
            const oldImagePath = path.join(__dirname, '../../public/img/blog-pics/', result[0].blog_img);

            const base64Image = blogImg.split(';base64,').pop();
            const imageName = OldimageId + '.' + getFileExtensionFromDataURL(blogImg);
            const blogImgPath = path.join(__dirname, '../../public/img/blog-pics/', imageName);

            if (base64Image.length > 0) {
                fs.unlink(oldImagePath, (err) => {
                    if (err) {
                        console.error('Error deleting old blog image:', err);
                    } else {
                        // console.log('Old image deleted successfully');
                        // Continue with saving the new image
                        fs.writeFile(blogImgPath, base64Image, { encoding: 'base64' }, function(err) {
                            if (err) {
                                console.log('Error saving blog image:', err);
                                success = false;
                            }
                        });
                    }
                });
                currentImg = imageName;
            }

            db.query(
                'UPDATE blog_i SET blog_title = ?, blog_content = ?, blog_img = ?, blog_lastmodified = NOW() WHERE blog_id = ?',
                [blogTitle, blogContent, currentImg, result[0].blog_id],
                (updateError, updateRes) => {
                    if (updateError) {
                        return res
                            .status(500)
                            .json({ error: 'Failed to update blog' })
                    }

                    if (updateRes.affectedRows > 0) {
                        const logRes = uploadToLog(
                            authorId, blogId, username, 'updated a', 'blog', blogTitle
                        )

                        if (logRes) {
                            return res.status(200).json({ message: 'Blog updated successfully' });
                        }
                    } else {
                        return res.status(500).json({ message: 'Failed to update blog' });
                    }
                }
            );
        } else {
            const newId = uniqueId.uniqueIdGenerator();
            let newImageName = '';

            // Handle image upload and renaming
            if (req.file) {
                newImageName = moveFileToDirectory(
                    req.file,
                    newId,
                    '../../public/img/blog-pics'
                )
            }

            newImageName = blogImg.replace(/\\\\/g, '\\')
            shortenedBlogContent = limitWords(blogContent, 60)

            // const logRes = uploadToLog(
            //     authorId, newId, username, 'posted a', 'blog', blogTitle
            // )

            // // Create a new blog
            db.query(
                'INSERT INTO blog_i (blog_id, blog_author, blog_dateadded, blog_title, blog_content, blog_img) VALUES (?, ?, NOW(), ?, ?, ?)',
                [newId, authorId, blogTitle, blogContent, newImageName],
                (createError, createRes) => {
                    if (createError) {
                        console.log(createError)
                        return res
                            .status(500)
                            .json({ error: 'Failed to create blog' })
                    }

                    if (createRes.affectedRows > 0) {
                        const logRes = uploadToLog(
                            authorId, newId, username, 'posted a', 'blog', blogTitle
                        )

                        console.log("Posting Email Notification");

                        axios.post(`${process.env.EMAIL_DOMAIN}/newsletter`, {
                            username: username,
                            type: 'Blog',
                            title: blogTitle,
                            img: `blog-pics/${newImageName}`,
                            details: shortenedBlogContent,
                            contentId: newId
                        })

                        updateContentStat('blog');

                        if (logRes) {
                            return res.status(201).json({ message: 'Blog created successfully' });
                        }
                    } else {
                        return res
                            .status(500)
                            .json({ error: 'Failed to create blog' })
                    }
                }
            )
        }
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

// Controller to delete a blog
const deleteBlog = async (req, res) => {
    const { blogId, username } = req.body

    try {
        const result = await getBlogById(blogId)

        if (result.length > 0 && result[0].hasOwnProperty('blog_id')) {
            db.query("UPDATE blog_i SET blog_flag = 0 WHERE blog_id = ?", [blogId], (deleteError, deleteRes) => {
                if (deleteError) {
                    console.log(deleteError);
                    return res.status(500).json({ error: 'Failed to delete blog' });
                }

                if (deleteRes.affectedRows > 0) {
                    const logRes = uploadToLog(
                        result[0].blog_author, result[0].blog_id, username, 'deleted a', 'blog', result[0].blog_title
                    )

                    if (logRes) {
                        return res.status(201).json({ message: 'Blog deleted successfully' });
                    }
                } else {
                    return res.status(500).json({ error: 'Failed to delete blog' });
                }
            });
        } else {
            return res.status(500).json({ error: 'Blog does not exist!' })
        }
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

const getEnablerBlogs = async (request, response) => {
    console.log(`getEnablerBlogs() from ${request.ip}`);
    try {
        const getEnablerBlogsQuery = `
            SELECT blog_i.* FROM blog_i
            INNER JOIN member_i ON member_i.member_id = blog_i.blog_author
            WHERE member_i.member_restrict IS NULL AND member_i.member_flag = 1
            AND member_i.member_type = 2 AND blog_i.blog_flag = 1
        `;
        db.query(getEnablerBlogsQuery, (error, result) => {
            if (error) {
                console.error(error);
                return result.status(500).json({ error: 'Internal server error' });
            }

            if (result.length > 0) {
                console.log("200 Enabler Blogs")
                return response.status(200).json(result);
            } else {
                console.log("404 Enabler Blogs Does Not Exist")
                return response.status(404).json({ error: "Enabler Blogs Does Not Exist"});
            }
        });

    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Internal server error' });
    }
}

const getCompanyBlogs = async (request, response) => {
    console.log(`getCompanyBlogs() from ${request.ip}`);
    try {
        const getCompanyBlogsQuery = `
            SELECT blog_i.* FROM blog_i
            INNER JOIN member_i ON member_i.member_id = blog_i.blog_author
            WHERE member_i.member_restrict IS NULL AND member_i.member_flag = 1
            AND member_i.member_type = 1 AND blog_i.blog_flag = 1
        `;
        db.query(getCompanyBlogsQuery, (error, result) => {
            if (error) {
                console.error(error);
                return result.status(500).json({ error: 'Internal server error' });
            }

            if (result.length > 0) {
                console.log("200 Company Blogs")
                return response.status(200).json(result);
            } else {
                console.log("404 Company Blogs Does Not Exist")
                return response.status(404).json({ error: "Company Blogs Does Not Exist"});
            }
        });

    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    blog,
    getBlog,
    getBlogImage,
    fetchAllBlogs,
    postBlog,
    deleteBlog,
    getEnablerBlogs,
    getCompanyBlogs
}
