// Creazione dello schema utente

const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose")

const UserSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        //required: true
    },
    iscrizioni: [{
        type: String            //lista degli eventi ai quali si è iscritti
    }]
})

UserSchema.plugin(passportLocalMongoose)
module.exports = mongoose.model('User', UserSchema)