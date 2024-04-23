const express = require('express')
const router = express.Router()
const multer = require('multer')
const storage = multer.memoryStorage() // Use memory storage for simplicity, adjust as needed

const upload = multer({ storage: storage })

const eventController = require('../controllers/eventController')

// const activityLogging = require('../middlewares/activityLogging')
// router.use(activityLogging)

router.get('/', eventController.event);
router.get('/:eventId', eventController.fetchEventById)
router.get('/user/:userId', eventController.events_user)
router.get('/img/:eventId', eventController.getEventImage)
router.post('/post', upload.single('image'), eventController.create_update);
router.post('/delete', eventController.deleteEvent)

module.exports = router