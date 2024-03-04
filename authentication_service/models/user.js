const mongoose = require('mongoose');
const Schema=mongoose.Schema;

const User = new Schema({
    username:{
        type: String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    fullname:{
        type:String,
        required:true
    },
    phone:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    balance:{
        type:Number,
    }
})
module.exports=mongoose.model('User',User);