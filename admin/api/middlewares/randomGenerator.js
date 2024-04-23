const crypto = require('crypto')
const bcrypt = require('bcrypt')

const generateRandomDigits = () => {
    // Generate 9 random digits
    const randomDigits = Math.floor(100000000 + Math.random() * 900000000)
    return randomDigits.toString()
}

const hashToSHA256 = (data) => {
    // Create a SHA-256 hash
    const hash = crypto.createHash('sha256')
    hash.update(data)
    return hash.digest('hex')
}

const hashToBcrypt = async (data) => {
    // Hash to bcrypt
    const saltRounds = 10
    const hashedValue = await bcrypt.hash(data, saltRounds)
    return hashedValue
}

const generateAndHash = async () => {
    // Generate random digits
    const randomDigits = generateRandomDigits()

    // Hash to SHA-256
    const hashedValue = hashToSHA256(randomDigits)
    const hashBcryptValue = await hashToBcrypt(randomDigits)

    return {
        randomDigits: randomDigits,
        hashedSHA: hashedValue,
        hashedBcrypt: hashBcryptValue,
    }
}

module.exports = {
    generateAndHash,
    hashToSHA256,
    hashToBcrypt
}
