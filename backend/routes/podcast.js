// route for podcast
const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/multer");
const Category = require("../models/category");
const Podcast = require("../models/podcast");
const User = require("../models/user");

//add podcast
router.post("/add-podcast",authMiddleware,upload, async(req,res)=>{
    try {
    const {title,description,category} = req.body;
    const frontImage = req.files["frontImage"][0].path;
    const audioFile = req.files["audioFile"][0].path;
    if(!title || !description || !category || !frontImage || !audioFile)
    {
        return res.status(400).json({message:"all fields are required"});
    }
    const {user} = req;
    const cat= await Category.findOne({categoryName: category});
    if(!cat)
    {
        return res.status(400).json({message:"No category found"});
    }
    const catid = cat._id;
    const userid = user._id;
    const newPodcast = new Podcast({
        title,description,category:catid,frontImage,audioFile,user:userid,
    });
    await newPodacst.save();
    await Category .findByIdAndUpdate(catid,{
        $push: {podcasts: newPodcast._id},
    });
    await User.findByIdAndUpdate(userid, {$push: {podcasts: newPodcast._id}});
    res.status(200).json({message: "podcast added successfully"});
    } 
    catch (error) {
       return res.status(500).json({message:"failed to add podcast"});
    }
});

//get all podcasts
router.get("/get-podcasts",async(req,res)=>{
    try{
        const podcasts = await Podcast.find().populate("category").sort({createdAt:-1});
        return res.status(200).json({data: podcasts });
    } catch(error){
        return res.status(500).json({message:"internal server error"});
    }
});

//get user podcasts
router.get("/get-user-podcasts", authMiddleware, async(req,res)=> {
    try {
        const {user} = req;
        const userid = user._id;
        const data = await User.findById(userid).populate({
            path: "podcasts",
            populate: {path: "category"},
        }).select("-password");
        if(data && data.podacsts)
        {
            data.podcasts.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
        }
        return res.status(200).json({data: data.podcasts });
    } catch (error) {
        return res.status(500).json({message:"internal server error"});
    }
});

//get podcast by id
router.get("/get-podcast/:id",async(req,res)=>{
    try{
        const {id} =req.params;
        const podcasts = await Podcast.findById(id).populate("category");
        return res.status(200).json({data: podcasts });
    } catch(error){
        return res.status(500).json({message:"internal server error"});
    }
});

//get podcast by category
router.get("/category/:cat",async(req,res)=>{
    try{
        const {cat} =req.params;
        const categories = await Category.find({categoryName:cat}).populate({path:"podcasts", populate:{path:"category"}
        });
        let podcasts =[];
        categories.forEach((category)=>{
            podcasts = [...podcasts, ...category.podcasts];
        });
        return res.status(200).json({data: podcasts });
    } catch(error){
        return res.status(500).json({message:"internal server error"});
    }
});

module.exports = router;