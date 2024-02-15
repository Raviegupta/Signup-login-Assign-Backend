const express = require('express');
const app = express();
const { default: mongoose } = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const port = process.env.PORT || 6000;

app.use(express.json());
app.use(cors());

// Database Connection with MongoDB
const mongoURL=process.env.mongoDB_URL
mongoose.connect(mongoURL)

// API Creation
app.get('/', (req, res)=>{
    res.send('Our Blinkt Imager Express app is running')
})

// API Listening
app.listen(port, (err)=>{
    if(!err) console.log('Server is Running at Port ' + port);
    else console.log('Error' + err);
})

// Schema for creating User model
const Users = mongoose.model('User', {
    name:{
        type:String,
    },
    email:{
        type:String,
        unique:true,
    },
    password:{
        type:String
    },
    date:{
        type:Date,
        default:Date.now,
    }
})

// Creating EndPoint for User Registration
app.post('/signup', async (req, res)=>{
    let check = await Users.findOne({email:req.body.email});
    if(check) {
        return res.status(400).json({success:false, errors: 'email is already registered'})
    }

    const user = new Users({
        name:req.body.name,
        email:req.body.email,
        password:req.body.password
    })
    await user.save();

    // jwt authentication
    const data={
        user:user.id,
    }
    const token = jwt.sign(data, 'secret_ravie');
    res.json({success:true, token})
})

// Creating EndPoint for User login
app.post('/login', async (req, res)=>{
    let user = await Users.findOne({email:req.body.email});
    if(user){
        const passCompare = req.body.password === user.password;
        if(passCompare){
            const data={
                id:user.id
            }
            const token = jwt.sign(data, 'secret_ravie');
            res.json({success:true, token})
        }
        else{
            res.send({success:false, errors:'Wrong Password'})
        }
    }
    else{
        res.json({success:false, errors:'Email not registered'})
    }
})

// Creating Image Storage Engine
const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb)=>{
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})
const upload = multer({storage:storage})

// Creating Upload EndPoint for uploading the images
app.use('/images', express.static('upload/images'))

app.post('/upload', upload.single('product'), (req, res)=>{
    res.json({
        success: 1,
        image_url: `http://localhost:${port}/images/${req.file.filename}`
    })
})

// Schema for Images
const Products = mongoose.model('Product', {
    id:{
        type:Number,
        required:true,
    },
    image:{
        type:String,
        required:true,
    },
    date:{
        type:Date,
        default:Date.now,
    },
    available:{
        type:Boolean,
        default:true,
    }
})

// Creating API for Adding Images
app.post('/addproduct', async (req, res)=>{
    let products = await Products.find({})
    let id;
    if(products.length>0){
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id+1;
    }else{
        id=1;
    }

    const product = new Products({
        id:id,
        image:req.body.image
    });

    await product.save();
    console.log('saved')

    res.json({success:true, name:req.body.name})
})

// Creating API for getting All Images
app.get('/allproducts', async (req, res)=>{
    let products = await Products.find({})
    console.log('All Images Fetched');
    console.log(products)
    res.send(products);
})
