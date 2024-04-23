const express = require('express');
const router = express.Router();
const programController = require('../controllers/programController');

router.use(express.json());
router.use(express.urlencoded({ extended: true }));


// const activityLogging = require('../middlewares/activityLogging')
// router.use(activityLogging)

router.get('/', programController.allPrograms);
router.get('/:program_id', programController.fetchProgram);
router.get('/user/:id', programController.fetchAllPrograms);
router.get('/page/:pageId', programController.fetchProgramPage);
router.post('/page/save/:pageId', programController.saveElementsController);

router.post('/delete/:program_id', programController.deleteProgam);
router.get('/delete/page/:page_id', programController.deletePage);

router.post('/change_img', programController.changeCoverPic);
router.post('/change_title', programController.changeTitlePage);
router.post('/create_program', programController.createProgram);
router.post('/create_page', programController.createUpdatePage);

module.exports = router;