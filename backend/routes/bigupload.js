const router = require('koa-router')()
const uploadBigfile = require('../controller/uploadBigfile')

router.post('/update', uploadBigfile.update)
router.post('/mergeSlice', uploadBigfile.mergeSlice)
router.post('/checkFile', uploadBigfile.checkFile)
router.post('/clearDir', uploadBigfile.clearDir)

module.exports = router