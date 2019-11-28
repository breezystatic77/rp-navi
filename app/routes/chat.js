var express = require('express');
var router = express.Router();
const chatCtrl = require('../controllers/chat')

router.get('/', (req, res) => {
	if (req.session.username) {
		res.render('./chat/chat-page')
	}
	else {
		res.redirect('/')
	}
});

module.exports = router;