// NOT USED YET — the app currently checks ADMIN_PASSWORD as plain text
// (see auth.js). This script is here for when you're ready to switch to
// a hashed password instead:
//
//   1. node hash-password.js "yourNewPassword"
//   2. put the output in .env as ADMIN_PASSWORD_HASH=<result> (remove
//      ADMIN_PASSWORD)
//   3. update auth.js to bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)
//      instead of the plain string comparison
import bcrypt from 'bcryptjs'

const password = process.argv[2]

if (!password) {
  console.error('Usage: node hash-password.js "yourNewPassword"')
  process.exit(1)
}

console.log(bcrypt.hashSync(password, 10))
