const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const path = require('path');

// mongodb user model
const User = require('./../models/User');
const UserVerification = require('../models/UserVerification');

// mongodb user OTP Verification model
const UserOTPVerification = require('../models/UserOTPVerification');

// mongodb user reset password
const PasswordReset = require('../models/PasswordReset');

// Setting server url
const development = process.env.DEVELOPMENT_URL
const currentUrl = development;

// Nodemailer Setup
let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
    }
});

// Testing success
transporter.verify((error, success) => {
    if (error) {
        console.log(error);
    } else {
        console.log("Ready for messages...");
    }
});

// Signup route
router.post('/signup', (req, res) => {
    let { name, email, password, dateOfBirth } = req.body;
    name = name.trim();
    email = email.trim();
    password = password.trim();
    dateOfBirth = dateOfBirth.trim();

    if (name == "" || email == "" || password == "" || dateOfBirth == "") {
        res.json({ status: "FAILED", message: "Empty Input Fields!" });
    } else if (!/^[a-zA-Z ]*$/.test(name)) {
        res.json({ status: "FAILED", message: "Invalid name entered" });
    } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        res.json({ status: "FAILED", message: "Invalid email entered" });
    } else if (!new Date(dateOfBirth).getTime()) {
        res.json({ status: "FAILED", message: "Invalid Date Of Birth entered" });
    } else if (password.length < 8) {
        res.json({ status: "FAILED", message: "Password is too short!" });
    } else {
        // Checking if user already exists
        User.find({ email }).then(result => {
            if (result.length) {
                res.json({ status: "FAILED", message: "User with the provided email already exists!" });
            } else {
                const saltRounds = 10;
                bcrypt.hash(password, saltRounds).then(hashedPassword => {
                    const newUser = new User({
                        name,
                        email,
                        password: hashedPassword,
                        dateOfBirth,
                        verified: false
                    });

                    newUser.save().then(result => {
                        //sendVerificationEmail(result, res);
                        sendOTPVerificationEmail(result, res);
                    }).catch(err => {
                        res.json({ status: "FAILED", message: "An error occurred while saving user account!" });
                    });
                }).catch(err => {
                    res.json({ status: "FAILED", message: "An error occurred while hashing password!" });
                });
            }
        }).catch(err => {
            res.json({ status: "FAILED", message: "An error occurred while checking for existing user!" });
        });
    }
});

// Send OTP Verification Email
const sendOTPVerificationEmail = async ({ _id, email }, res) => {
    try {
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`;

        // Mail Options
        const mailOptions = {
            from: process.env.AUTH_EMAIL,
            to: email,
            subject: "Verify Your Email!!",
            html: `<p>Enter <b>${otp}</b> in the app to verify your email address and complete the signup process.</p><br><p>This code <b>expires in 1 hour</b>.</p>`,
        };

        // Hash the otp
        const saltRounds = 10;
        const hashedOTP = await bcrypt.hash(otp, saltRounds);
        const newOTPVerification = await new UserOTPVerification({
            userId: _id,
            otp: hashedOTP,
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000,
        });

        // Save OTP Record
        await newOTPVerification.save();
        await transporter.sendMail(mailOptions);
        res.json({
            status: "PENDING",
            message: "Verification otp email email sent",
            data: { userId: _id, email },
        });
    } catch (error) {
        res.json({
            status: "FAILED",
            message: error.message
        });
    }
}

// Verify OTP Email
router.post("/verifyOTP", async (req, res) => {
    try {
        let { userId, otp } = req.body;
        if (!userId || !otp) {
            throw Error("Empty otp details are not allowed.");
        } else {
            const UserOTPVerificationRecords = await UserOTPVerification.find({
                userId,
            });

            if (UserOTPVerificationRecords.length <= 0) {
                // no record found
                throw new Error(
                    "Account record doesn't exist or has been verified already. Please sign up or log in!"
                )
            } else {
                // user otp record exists
                const { expiresAt } = UserOTPVerificationRecords[0];
                const hashedOTP = UserOTPVerificationRecords[0].otp;

                if (expiresAt < Date.now()) {
                    // user otp record has expired
                    await UserOTPVerification.deleteMany({ userId });
                    throw new Error("Code has expired! Please request again.");
                } else {
                    // validity of code 
                    const validOTP = await bcrypt.compare(otp, hashedOTP);

                    if (!validOTP) {
                        // supplied otp is wrong
                        throw new Error("Invalid code Passed. Please check your Inbox.");
                    } else {
                        // success
                        await User.updateOne({ _id: userId }, { verified: true });
                        await UserOTPVerification.deleteMany({ userId });
                        res.json({
                            status: "VERIFIED",
                            message: "User Email verified Successfully.",
                        });
                    }

                }
            }
        }
    } catch (error) {
        res.json({
            status: "FAILED",
            message: error.message
        });
    }

})

// Resend OTP Verification
router.post("/resendOTPVerificationCode", async (req, res) => {
    try {
        let { userId, email } = req.body;

        if (!userId || !email) {
            throw Error("Empty user details are not allowed!");
        } else {
            // delete existing records and resend
            await UserOTPVerification.deleteMany({ userId });
            sendOTPVerificationEmail({ _id: userId, email }, res);
        }

    } catch (error) {
        res.json({
            status: "FAILED",
            message: error.message
        });
    }
});


// Send verification email
const sendVerificationEmail = ({ _id, email }, res) => {
    const uniqueString = uuidv4() + _id;

    const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Please, Verify your Email!",
        html: `<p>Please verify your email address to complete the signup and login into your account.</p>
               <p>This link <b>expires in 6 Hours</b>.</p>
               <p>Press <a href=${currentUrl + "user/verify/" + _id + "/" + uniqueString}> here </a> to proceed. </p>`,
    };

    bcrypt.hash(uniqueString, 10).then((hashedUniqueString) => {
        const newVerification = new UserVerification({
            userId: _id,
            uniqueString: hashedUniqueString,
            createdAt: Date.now(),
            expireAt: Date.now() + 21600000, // 6 hours
        });

        newVerification.save().then(() => {
            transporter.sendMail(mailOptions).then(() => {
                res.json({
                    status: "PENDING",
                    message: "Verification email sent",
                    data: { userId: _id, email },
                });
            }).catch(err => {
                res.json({ status: "FAILED", message: "Verification email Failed" });
            });
        }).catch(error => {
            res.json({ status: "FAILED", message: "Couldn't save verification email data" });
        });
    }).catch(() => {
        res.json({ status: "FAILED", message: "An error occurred while hashing email data!" });
    });
};

// Resend verification link
router.post("/resendVerificationLink", async (req, res) => {
    try {
        let { userId, email } = req.body;
        if (!userId || !email) throw new Error("Empty user details are not allowed");
        await UserVerification.deleteMany({ userId });
        sendVerificationEmail({ _id: userId, email }, res);
    } catch (error) {
        res.json({ status: "FAILED", message: `Verification Link Resend Error. ${error.message}` });
    }
});

// Email verification route
router.get("/verify/:userId/:uniqueString", async (req, res) => {
    let { userId, uniqueString } = req.params;

    try {
        const result = await UserVerification.find({ userId });

        if (result.length > 0) {
            const { expiresAt, uniqueString: hashedUniqueString } = result[0];

            if (expiresAt < Date.now()) {
                await UserVerification.deleteOne({ userId });
                await User.deleteOne({ _id: userId });
                let message = "Link has expired. Please sign up again!";
                res.redirect(`/user/verified?error=true&message=${message}`);
            } else {
                const match = await bcrypt.compare(uniqueString, hashedUniqueString);

                if (match) {
                    await User.updateOne({ _id: userId }, { verified: true });
                    await UserVerification.deleteOne({ userId });

                    res.sendFile(path.join(__dirname, "./../views/verified.html"));
                } else {
                    let message = "Invalid verification details passed. Check your inbox.";
                    res.redirect(`/user/verified?error=true&message=${message}`);
                }
            }
        } else {
            let message = "Account record doesn't exist or has been verified already. Please sign up or log in!";
            res.redirect(`/user/verified?error=true&message=${message}`);
        }
    } catch (error) {
        console.log(error);
        let message = "An error occurred while checking for existing user verification record.";
        res.redirect(`/user/verified?error=true&message=${message}`);
    }
});


// Signin
router.post('/signin', (req, res) => {
    let { email, password } = req.body;
    email = email.trim()
    password = password.trim()

    if (email == "" || password == "") {
        res.json({
            status: "FAILED",
            message: "Empty credentials supplied!"
        });
    } else {
        // Check if user exist
        User.find({ email })
            .then(data => {
                if (data.length) {
                    // User exists

                    const hashedPassword = data[0].password;
                    bcrypt.compare(password, hashedPassword).then(result => {
                        if (result) {
                            // Password Match
                            res.json({
                                status: "SUCCESS",
                                message: "Signin Successful",
                                data: data
                            })
                        } else {
                            res.json({
                                status: "FAILED",
                                message: "Invalid Password entered"
                            })
                        }
                    })
                        .catch(err => {
                            res.json({
                                status: "FAILED",
                                message: "An error occurred while comparing passwords"
                            })
                        })

                } else {
                    res.json({
                        status: "FAILED",
                        message: "Invalid credentials entered!"
                    })
                }
            })
            .catch(err => {
                res.json({
                    status: "FAILED",
                    message: "An error occurred while checking for existing user"
                })
            })
    }

});

// Password Reset Stuff
router.post('/requestPasswordReset', (req, res) => {
    const { email, redirectUrl } = req.body;

    // check if email exists
    User
        .find({ email })
        .then((data) => {
            if (data.length) {
                // user exists
                //console.log("Data to check: ",data)

                /*
                // check if user is verified
                if (!data[0].verified) {
                    res.json({
                        status: "FAILED",
                        message: "Email hasn't verified yet. Check your Inbox!"
                    }) 
                } else {
                    // proceed with email to reset password
                    sendResetEmail(data[0], redirectUrl, res); 
                }
                */

                // As data is verified and then added in the User model. Hence no need to check verified again 
                sendResetEmail(data[0], redirectUrl, res);


            } else {
                res.json({
                    status: "FAILED",
                    message: "No account with this email exists!"
                })
            }
        })
        .catch(error => {
            console.log(error);
            res.json({
                status: "FAILED",
                message: "An error occurred while checking for existing user."
            })
        })

});

// send password reset email
const sendResetEmail = ({ _id, email }, redirectUrl, res) => {
    const resetString = uuidv4() + _id;

    // First, we clear all existing reset records
    PasswordReset
        .deleteMany({ userId: _id })
        .then(result => {
            // Reset records deleted successfully
            // Now, send the email

            redirectLink = process.env.REDIRECT_LINK;

            /*
            // mail options 
            const mailOptions = {
                from: process.env.AUTH_EMAIL,
                to: email,
                subject: "Password Reset!",
                html: `<p>We heard that you lost your Password.</p>
                       <p>Don't worry ! Use the link below to reset it.</p>
                       <p>This link <b>expires in 60 minutes</b>.</p>
                       <p>Press <a href="${redirectLink + '/' + redirectUrl + '/' + _id + '/' + resetString}"> here </a> to proceed. </p>`,
            };
            */

            // mail options 
            const mailOptions = {
                from: process.env.AUTH_EMAIL,
                to: email,
                subject: "Password Reset!",
                html: `<p>We heard that you lost your Password.</p>
                       <p>Don't worry ! Use the code below to reset it.</p>
                       <p>Copy the below code and paste it in you app as asked to proceed.</p>
                       <p>This code <b>expires in 60 minutes</b>.</p>
                       <p>Copy it : "<b>${redirectUrl + '/' + _id + '/' + resetString}</b>"</p>`,
            };

            // hash the reset string
            const saltRounds = 10;
            bcrypt
                .hash(resetString, saltRounds)
                .then(hashedResetString => {
                    // set values in password reset collection
                    const newPasswordReset = new PasswordReset({
                        userId: _id,
                        resetString: hashedResetString,
                        createdAt: Date.now(),
                        expiresAt: Date.now() + 3600000
                    });

                    newPasswordReset
                        .save()
                        .then(() => {
                            transporter
                                .sendMail(mailOptions)
                                .then(() => {
                                    // reset email sent and password reset record saved
                                    res.json({
                                        status: "PENDING",
                                        message: "Password reset email sent!",
                                        resetLink: `${redirectUrl + '/' + _id + '/' + resetString}`, // Include the reset link in the response
                                        userId: _id,
                                        resetString: resetString
                                    })
                                })
                                .catch(error => {
                                    console.log(error);
                                    res.json({
                                        status: "FAILED",
                                        message: "Password reset email failed!"
                                    })
                                })
                        })
                        .catch(error => {
                            console.log(error);
                            res.json({
                                status: "FAILED",
                                message: "Coudn't save password reset data!"
                            })
                        })

                })
                .catch(error => {
                    console.log(error);
                    res.json({
                        status: "FAILED",
                        message: "An error has occurred while passing the password reset data!"
                    })
                })

        })
        .catch(error => {
            // error while clearing existing records
            console.log(error);
            res.json({
                status: "FAILED",
                message: "Clearing existing password reset records failed!"
            })
        })

}

// Actually Reset the Password
router.post("/resetPassword", (req, res) => {
    let { userId, resetString, newPassword } = req.body;

    PasswordReset
        .find({ userId })
        .then(result => {
            if (result.length > 0) {
                // Password reset record exists so we proceed

                const { expireAt } = result[0];
                const hashedResetString = result[0].resetString;

                // Checking for expired reset string
                if (expireAt < Date.now()) {
                    PasswordReset
                        .deleteOne({ userId })
                        .then(() => {
                            // Reset record deleted successfully
                            res.json({
                                status: "FAILED",
                                message: "Password reset link has expired!"
                            })
                        })
                        .catch(error => {
                            // deletion failed
                            console.log(error);
                            res.json({
                                status: "FAILED",
                                message: "Clearing password reset record failed!"
                            })
                        })
                } else {
                    // valid reset record exists so we validate the reset string
                    // First compare the hashed reset string

                    bcrypt
                        .compare(resetString, hashedResetString)
                        .then((result) => {
                            if (result) {
                                // strings passed
                                // hash password again

                                const saltRounds = 10;
                                bcrypt
                                    .hash(newPassword, saltRounds)
                                    .then(hashedNewPassword => {
                                        // update user password

                                        User
                                            .updateOne({ _id: userId }, { password: hashedNewPassword })
                                            .then(() => {
                                                // update complete. Now delete reset record
                                                PasswordReset
                                                    .deleteOne({ userId })
                                                    .then(() => {
                                                        // both user record and paswword record updated
                                                        res.json({
                                                            status: "SUCCESS",
                                                            message: "Password has been reset successfully!"
                                                        })
                                                    })
                                                    .catch(error => {
                                                        console.log(error);
                                                        res.json({
                                                            status: "FAILED",
                                                            message: "An error occurred while finalizing password reset!"
                                                        })
                                                    })

                                            })
                                            .catch(error => {
                                                console.log(error);
                                                res.json({
                                                    status: "FAILED",
                                                    message: "Updating user password failed!"
                                                })
                                            })

                                    })
                                    .catch(error => {
                                        console.log(error);
                                        res.json({
                                            status: "FAILED",
                                            message: "An error occurred while hashing new password!"
                                        })
                                    })


                            } else {
                                // Existing record but incorrect reset string passed
                                res.json({
                                    status: "FAILED",
                                    message: "Invalid password reset details passed!"
                                })
                            }
                        })
                        .catch(error => {
                            console.log(error);
                            res.json({
                                status: "FAILED",
                                message: "Comparing password reset strings failed!"
                            })
                        })
                }

            } else {
                // Password reset record doesn't exist
                res.json({
                    status: "FAILED",
                    message: "Password reset request not found!"
                })
            }
        })
        .catch(error => {
            console.log(error);
            res.json({
                status: "FAILED",
                message: "Checking for existing password reset record failed!"
            })
        })
})

module.exports = router;
