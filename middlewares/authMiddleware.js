const ApiError = require("../utils/ApiError")
const jwt = require('jsonwebtoken');
const User = require('../schemas/UserSchema');


const verifyJWT = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        console.log('Token: ', token);

        // console.log(token);
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -jwtToken")

        if (!user) {
            throw new ApiError(401, "Invalid  Token")
        }
        //injecting the user afer verification
        req.user = user;
        next();

    } catch (error) {
        throw new ApiError(401, "Invalid access token")
    }

}

module.exports = verifyJWT;


