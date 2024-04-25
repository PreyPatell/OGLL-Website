//jwt stuff
const jwt = require('jsonwebtoken');
const createTokens = (user) => {
    const accessToken = jwt.sign(
        { email: user.email, username: user.username, id: user.id, role: user.accountType},
        "thisisasecret",
    );

    return accessToken;
}

module.exports = {createTokens};