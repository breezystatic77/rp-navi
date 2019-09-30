/**
 * @file English langauge messages to send back to the client for account 
 *       related tasks
 */

const messages ={
    VERIFY_SUCCESS:     'Account has been verified',
    VERIFY_FAILED:      'Account could not be verified',
    ACCT_VERIFIED:      'Account verified',
    ACCT_UNVERIFIED:    'Account is not verified yet',
    ACCT_DISABLED:      'Account was disabled',
    ACCT_DISABLED_FAIL: 'Account was not disabled',

    EMAIL_CHANGED:      'Email updated',
    EMAIL_NOT_CHANGED:  'Unable to update email',
    EMAIL_BAD_INPUT:    'Email does not meet requirements',

    PW_UPDATED:         'Password updated',
    PW_NOT_UPDATED:     'Unable to change password',
    PW_BAD_INPUT:       'Password does not meet requirements',

    PW_REQUESTED:       'If the username exists, you\'ll get an email',
    PW_REQUEST_EXP:     'Password request expired',

}

exports.messages = messages