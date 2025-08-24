import jwt from 'jsonwebtoken';
const userAuth = async (request, response, next) => {
    const {token} = request.cookies;

    if(!token){
        return response.json({
            success  : false,
            message : "Not Authorized. Login again!"
        })
    }

    try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET)

        if(tokenDecode && tokenDecode.id){
            if (!request.body) {
                request.body = {};
            }
            request.body.userId = tokenDecode.id;
            
            // Set request.user for controllers to access
            request.user = { id: tokenDecode.id };
        } else {
            return response.json({
                success  : false,
                message : "Not Authorized. Login again!"
            })
        }
        
        next();

    } catch (error) {
        return response.json({
            success : false,
            message : error.message
        })
    }
}

export default userAuth;