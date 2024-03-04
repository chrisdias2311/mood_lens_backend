const colors = require('colors');
const ApiError = require('../utils/ApiError')
const ApiResponse = require('../utils/ApiResponse');
const User = require('../schemas/UserSchema');

//helper functions
const generateTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const jwtToken = await user.generateToken();

    user.jwtToken = jwtToken;//injecting jwtToken to user
    await user.save({ validateBeforeSave: false })
    // console.log('Save token'.cyan, user.jwtToken);

    return jwtToken;


  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating referesh and access token")
  }
}

// Helper function to generate a random password
const generateRandomPassword = () => {
  const randomDigits = Math.floor(1000 + Math.random() * 9000); // Generate a random 4-digit number
  return randomDigits; // Append 'Password' prefix to the number
}

const registerController = async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  // console.log(`${req.body}`.bgCyan.white);
  const { email, username, password } = req.body;
  console.log(email, username, password);

  if (
    [email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required")
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists")
  }

  const user = await User.create({
    username: username,
    email,
    password
  })

  const createdUser = await User.findById(user._id).select(
    "-password -jwtToken"
  )

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user")
  }

  return res.status(201).send(
    new ApiResponse(200, createdUser, "User registered Successfully")
  )

}

const loginController = async (req, res) => {
  // req body -> data
  // username or email
  //find the user
  //password check
  //access and referesh token
  //send cookie

  const { email, password } = req.body

  if (!email) {
    throw new ApiError(400, "username or email is required")
  }


  const user = await User.findOne({ email })

  if (!user) {
    throw new ApiError(404, "User does not exist")
  }

  const isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
  }

  const jwtToken = await generateTokens(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -jwtToken")



  return res
    .status(200)
    .send(
      new ApiResponse(
        200,
        {
          user: loggedInUser, jwtToken
        },
        "User logged In Successfully"
      )
    )

}

const googleSignInController = async (req, res) => {

  const { displayName, email } = req.body;

  // Validate input
  if (!displayName || !email) {
    throw new ApiError(400, "name and email are required");
  }

  // Check if the user already exists
  const existingUser = await User.findOne({ email }).select("-password");
  if (existingUser) {
    // User already exists, return existing JWT token
    return res.status(200).send(new ApiResponse(200, {
      user: existingUser,
      jwtToken: existingUser.jwtToken
    }, "User already exists")
    );
  }

  // Generate a random password for the user
  const displayNameWithoutSpaces = displayName.replace(/\s/g, '');
  const randomDigits = generateRandomPassword();
  const randomPassword = `${displayNameWithoutSpaces}${randomDigits}`;

  // Create a new user in the database
  const newUser = await User.create({
    username: displayName.replace(/\s/g, ''), // Remove spaces from display name
    email,
    password: randomPassword,
  });

  // Generate JWT token
  const jwtToken = await generateTokens(newUser._id);

  const googleLoggedUser = await User.findById(newUser._id).select("-password -jwtToken");

  return res
    .status(200)
    .send(
      new ApiResponse(
        200,
        {
          user: googleLoggedUser, jwtToken
        },
        "User logged In Successfully"
      )
    )

}

const testController = async (req, res) => {
  return res.status(200).send(new ApiResponse(200, req.user, "Test route"))
}




module.exports = { registerController, loginController, testController, googleSignInController }