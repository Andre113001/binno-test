const express = require('express')
const router = express.Router()
const socMedController = require('../controllers/socMedPostController')
const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

router.use(express.json())
router.use(express.urlencoded({ extended: true }))

// const activityLogging = require('../middlewares/activityLogging')
// router.use(activityLogging)

router.get('/', socMedController.post);
router.get('/:post_id', socMedController.fetchPost)
router.get('/user/:user_id', socMedController.fetchMemberPosts)
router.post('/upload', upload.single('image'), socMedController.updateCreatePost)
router.post('/delete', socMedController.deletePost)
router.post('/pin', socMedController.updatePostPin)
router.get('/pin/get', socMedController.getPostPinned)

module.exports = router
