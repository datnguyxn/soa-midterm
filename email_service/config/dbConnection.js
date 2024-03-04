const mongoose = require("mongoose")

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connect successfully');
    } catch (error) {
        console.log('Connect fail!',error);
    }
}

module.exports =  connectDb ;

