const logger = require('../utils/utils').logger
const nodemailer = require('nodemailer')

function sendMail(from, to, subject, text) {
	transporter = nodemailer.createTransport(
		smtpTransport({
			host: 'debugmail.io',
			port: 25,
			auth: {
				user: process.env.MAILER_ADDR,
				pass: process.env.MAILER_PW
			}
		})
	)
}

async function sendTestMail(sendTo = 'bar@example.com') {
	// Generate test SMTP service account from ethereal.email
	// Only needed if you don't have a real mail account for testing
	let testAccount = await nodemailer.createTestAccount()

	// create reusable transporter object using the default SMTP transport
	let transporter = nodemailer.createTransport({
		host: 'smtp.ethereal.email',
		port: 587,
		secure: false, // true for 465, false for other ports
		auth: {
			user: testAccount.user, // generated ethereal user
			pass: testAccount.pass // generated ethereal password
		}
	})

	// send mail with defined transport object
	let info = await transporter.sendMail({
		from: '"Fred Foo 👻" <foo@example.com>', // sender address
		to: sendTo, // list of receivers
		subject: 'Hello ✔', // Subject line
		text: 'Hello world?', // plain text body
		html: '<b>Hello world?</b>' // html body
	})

	logger.info('Message sent: %s', info.messageId)
	// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

	// Preview only available when sending through an Ethereal account
	logger.info('Preview URL: %s', nodemailer.getTestMessageUrl(info))
	// Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

async function sendVerifyMail(username, accountEmail, verifyKey) {
	verifyKey = verifyKey.replace('+', '%2B')
	// Generate test SMTP service account from ethereal.email
	// Only needed if you don't have a real mail account for testing
	let testAccount = await nodemailer.createTestAccount()

	// create reusable transporter object using the default SMTP transport
	let transporter = nodemailer.createTransport({
		host: 'smtp.ethereal.email',
		port: 587,
		secure: false, // true for 465, false for other ports
		auth: {
			user: testAccount.user, // generated ethereal user
			pass: testAccount.pass // generated ethereal password
		}
	})

	// send mail with defined transport object
	let info = await transporter.sendMail({
		from: '"RP Navi Admin" <foo@example.com>', // sender address
		to: accountEmail, // list of receivers
		subject: 'Verify your RP Navi account', // Subject line
		text:
			`Hello ${username}!\n\n` +
			`Here is your verification link: ${verifyKey}. Until you ` +
			`verify, the features of the site will be limited.\n\n` +
			`This email is autogenerated, please do not reply to it`,
		html:
			`Hello ${username}!</br></br>` +
			`Here is your verification link: <a href="${verifyKey}">` +
			`${verifyKey}</a>. Until you verify, the features of the ` +
			`site will be limited.</br></br>` +
			`This email is autogenerated, please do not reply to it`
	})

	logger.info('Message sent: %s', info.messageId)
	// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

	// Preview only available when sending through an Ethereal account
	logger.info('Preview URL: %s', nodemailer.getTestMessageUrl(info))
	// Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

async function sendPwResetEmail(username, accountEmail, resetKey) {
	resetKey = resetKey.replace('+', '%2B')
	// Generate test SMTP service account from ethereal.email
	// Only needed if you don't have a real mail account for testing
	let testAccount = await nodemailer.createTestAccount()

	// create reusable transporter object using the default SMTP transport
	let transporter = nodemailer.createTransport({
		host: 'smtp.ethereal.email',
		port: 587,
		secure: false, // true for 465, false for other ports
		auth: {
			user: testAccount.user, // generated ethereal user
			pass: testAccount.pass // generated ethereal password
		}
	})

	// send mail with defined transport object
	let info = await transporter.sendMail({
		from: '"RP Navi Admin" <foo@example.com>', // sender address
		to: accountEmail, // list of receivers
		subject: 'RP Navi account password reset', // Subject line
		text:
			`Hello ${username}!\n\n` +
			`You requested a password reset, the link is at: ${resetKey}. ` +
			`This link will expire in about 10 minutes. If you did not ` +
			`request a password reset, you can ignore this mail\n\n` +
			`This email is autogenerated, please do not reply to it`,
		html:
			`Hello ${username}!</br></br>` +
			`You requested a password reset, the link is at: <a href="${resetKey}` +
			`">${resetKey}</a>. This link will expire in about 10 minutes. If ` +
			`you did not request a password reset, you can ignore this mail` +
			`</br></br>` +
			`This email is autogenerated, please do not reply to it`
	})

	logger.info('Message sent: %s', info.messageId)
	// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

	// Preview only available when sending through an Ethereal account
	logger.info('Preview URL: %s', nodemailer.getTestMessageUrl(info))
	// Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

exports.sendVerifyMail = sendVerifyMail
exports.sendTestMail = sendTestMail
exports.sendPwResetEmail = sendPwResetEmail
