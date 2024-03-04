const mongoose = require('mongoose');
const Schema=mongoose.Schema;

const Student = new Schema({
    studentId: {
        type: String
    },
    fullname: {
        type: String
    }
})

module.exports=mongoose.model('Student',Student);

