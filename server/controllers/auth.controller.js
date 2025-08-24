import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";
import userProfileModel from "../models/userProfile.model.js";
import transporter from "../config/nodemailer.js";

export const register = async (request, response) => {
  const { name, email, password, username } = request.body;

  if (!name || !email || !password || !username) {
    return response.json({
      success: false,
      message: "Missing details",
    });
  }

  try {
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      return response.json({
        success: false,
        message: "User already exists",
      });
    }

    // Check if username already exists
    const existingProfile = await userProfileModel.findByUsername(username);
    if (existingProfile) {
      return response.json({
        success: false,
        message: "Username already exists",
      });
    }

    // Username validation
    if (username.length < 3) {
      return response.json({
        success: false,
        message: "Username must be at least 3 characters long"
      });
    }
    if (username.length > 30) {
      return response.json({
        success: false,
        message: "Username must be less than 30 characters"
      });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return response.json({
        success: false,
        message: "Username can only contain letters, numbers, and underscores"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });

    // Create user profile with username
    await userProfileModel.create({
      user_id: user.id,
      username: username,
      bio: "Hey there!",
      profile_picture: "Enter a profile picture.",
      cover_picture: "",
      location: ""
    });

    const token = jwt.sign(
      {
        id: user.id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    response.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    //sending welcome email
    const mailOptions = {
        from : process.env.SENDER_EMAIL,
        to : email,
        subject : 'Welcome to TrueSocial',
        text : `Welcome to TrueSocial. Your account has been created with the email : ${email}`
    }

    await transporter.sendMail(mailOptions);
    return response.json({
        success : true,
        message: "User registered successfully",
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            username: username,
            isEmailVerified: user.is_account_verified
          }
        }
    })

  } catch (error) {
    response.json({
      success: false,
      message: error.message,
    });
  }
};

export const login = async (request, response) => {
  const { email, password } = request.body;

  if (!email || !password) {
    return response.json({
      success: false,
      message: "Email and password are required",
    });
  }

  try {
    const user = await userModel.findByEmail(email);
    if (!user)
      return response.status(404).json({
        success: false,
        error: "User is not registered!",
      });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return response.json({
        success: false,
        message: "Invalid password",
      });
      }

    const token = jwt.sign(
      {
        id: user.id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    response.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return response.json({
      success: true,
      message: "User loggedIn successfully",
    });
  } catch (error) {
    return response.json({
      success: false,
      message: error.message,
    });
  }
};

export const logout = async (request, response) => {
  try {
    response.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return response.json({
        success : true,
        message : "user logged Out"
    })

  } catch (error) {
    return response.json({
      success: false,
      message: error.message,
    });
  }
};

// verification OTP
export const sendVerifyOtp = async (request, response) => {
    try {
        const {userId} = request.body;
        
        if (!userId) {
            return response.json({
                success: false,
                message: "User ID is required"
            });
        }
        
        const user = await userModel.findById(userId);
        
        if (!user) {
            return response.json({
                success: false,
                message: "User not found"
            });
        }
        
        if(user.is_account_verified){
            return response.json({
                success : false,
                message : "Account already verified"
            })
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const expireAt = Date.now() + 24*60*60*1000;
        await userModel.updateOtp(userId, 'verify', otp, expireAt);

        //sending verification otp email
        const mailOptions = {
            from : process.env.SENDER_EMAIL,
            to : user.email,
            subject : 'Account Verification OTP',
            text : `Your OTP is ${otp}. Verify your account using this otp.`
        }

        await transporter.sendMail(mailOptions);

        return response.json({
            success : true,
            message : "Verification OTP sent on Email"
        })

    } catch (error) {
        return response.json({
            success : false,
            message : error.message
        })
    }
}

// verify email with OTP
export const verifyEmail = async (request, response) => {
    const {userId, otp} = request.body;

    if(!userId || !otp) {
        return response.json({
            success : false,
            message : "Missing details"
        })
    }

    try {
        const user = await userModel.findById(userId);

        if(!user){
            return response.json({
                success : false,
                message : "User not found"
            })
        }

        if(!user.verify_otp || user.verify_otp !== otp){
            return response.json({
                success : false,
                message : "Invalid OTP"
            })
        }

        if(user.verify_otp_expire_at < Date.now()){
            return response.json({
                success : false,
                message : "OTP Expired"
            })
        }

        await userModel.updateVerificationStatus(userId, true);
        await userModel.updateOtp(userId, 'verify', '', 0);

        return response.json({
            success : true,
            message : "Account Verified Successfully"
        })
        
    } catch (error) {
        return response.json({
            success : false,
            message : error.message
        })
    }
}

// check user authentication
export const isAuthenticated = async (request, response) => {
    try {
        return response.json({
            success : true
        })
    } catch (error) {
        return response.json({
            success : false,
            message : error.message
        })
    }
}

// send password otp reset
export const sendResetOtp = async (request, response) => {
    const {email} = request.body;

    if(!email){
        return response.json({
            success : false,
            message : "Email is required"
        })
    }

    try {
        const user = await userModel.findByEmail(email);
        if(!user){
            return response.json({
                success : false,
                message : "User not found"
            })
        }
        
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const expireAt = Date.now() + 15*60*1000;
        await userModel.updateOtp(user.id, 'reset', otp, expireAt);

        const mailOptions = {
            from : process.env.SENDER_EMAIL,
            to : user.email,
            subject : 'Password reset OTP',
            text : `Your OTP for resetting your password is ${otp}. Reset your password using this otp.`
        }
    
        await transporter.sendMail(mailOptions);
    
        return response.json({
            success : true,
            message : "OTP sent on Email"
        })
        
    } catch (error) {
        return response.json({
            success : false,
            message : error.message
        })
    }
}

// Reset user password
export const resetPassword = async (request, response) => {
    const {email, otp, newPassword} = request.body;

    if(!email || !otp || !newPassword){
        return response.json({
            success : false,
            message : "Email, OTP and new Password are required"
        })
    }

    try {
        const user = await userModel.findByEmail(email);
        if(!user){
            return response.json({
                success : false,
                message : 'user not Found'
            })
        }

        if(user.reset_otp === "" || user.reset_otp !== otp){
            return response.json({
                success : false,
                message : "Invalid Otp"
            })
        }

        if(user.reset_otp_expire_at < Date.now()){
            return response.json({
                success : false,
                message : "OTP expired"
            })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await userModel.updatePassword(user.id, hashedPassword);
        await userModel.updateOtp(user.id, 'reset', '', 0);

        return response.json({
            success : true,
            message : "Password has been reset successfully"
        })

    } catch (error) {
        return response.json({
            success : false,
            message : error.message
        })
    }
}