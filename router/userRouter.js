const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authenticate = require("../middlewares/authenticate")

/*
    @usage : to Register a User
    @url : /api/users/register
    @fields : namw, email, password
    @method : POST 
    @process : PUBLIC
*/

router.post(
    "/register",
    async (request, response) => {
        try {
            let { name, email, password } = request.body;
            // CHeck if the user exists
            let user = await User.findOne({ email: email });

            if (user) {
                return response.status(201).json({ msg: "User already exists" })
            }

            let salt = await bcrypt.genSalt(10); // Salt is actually encrypted password
            password = await bcrypt.hash(password, salt);

            let avatar = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTOkHm3_mPQ5PPRvGtU6Si7FJg8DVDtZ47rw&usqp=CAU";

            user = new User({ name, email, password, avatar });
            await user.save();
            response.status(200).json({ msg: "Registration is successful" });
        } catch (error){
            console.error(error);
            response.status(500).json({errors : [{msg : error.message}]});
        }
    }
)

/*
    @usage : to Login a User
    @url : /api/users/login
    @fields : email , password
    @method : POST
    @access : PUBLIC
*/

router.post(
    "/login",

    async(request, response) => {
        try{
            let {email, password} = request.body;

            // Check if the correct email
            let user = await User.findOne({email: email});

            if(!user) {
                return response.status(201).json({errors: [{msg: "Invalid Credentials"}]});
            }

            // Check the passwords
            let isMatch = await bcrypt.compare(password, user.password);

            if(!isMatch) {
                return response.status(201).json({errors: [{msg: "Incorect Password"}]});
            }

            // Create a token end send to Client
            let payload = {
                user: {
                    id: user.id,
                    name: user.name
                }
            }

            jwt.sign(payload, process.env.JWT_SECRET_KEY, (error, token) => {
                if(error) throw error;
                response.status(200).json({
                    msg: "Login is Success",
                    token: token
                })
            })

        } catch (error){
            console.log(error);
            response.status(500).json({errors: [{msg: error.message}]});
        }
    }
)

/*
    @usage :  to get user Info
    @url : /api/users/me
    @fields : no-fields
    @method : GET
    @access : PRIVATE
 */

router.get("/me", authenticate, async(request, response) => {
    try{
        let user = await User.findById(request.user.id).select("-password");
        response.status(200).json({user: user});
    } catch(error){
        console.log(error);
        response.status(500).json({errors: [{msg: error.message}]});
    }
})

module.exports = router;