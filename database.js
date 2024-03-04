const mongoose = require ('mongoose');


const connUrl = `mongodb+srv://chrisdias2311:Kalvasai23!@cluster0.ohe32oi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
// const connUrl = `mongodb+srv://chrisdias2311:Kalvasai23!@cluster0.f2sym3y.mongodb.net/?retryWrites=true&w=majority`

const connectDB = async() => {
    try{
        const conn = await mongoose.connect(connUrl, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
        });
        console.log(`MongoDB connected to  ${conn.connection.host}`);
    } catch(error){
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

module.exports = connectDB;
