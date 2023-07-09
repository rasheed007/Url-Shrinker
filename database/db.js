const mongoose = require("mongoose")
const CONFIG = require("../config/config")


function connectToDb() {
    mongoose.set('strictQuery', false);
    
    mongoose.connect(CONFIG.MONGODB_URL), {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true
    }

    mongoose.connection.on("connected", () => {
        console.log("Mongodb connected successfully")
    })

    mongoose.connection.on("error", (err) => {
        console.log(err)

    })
}

module.exports = connectToDb

