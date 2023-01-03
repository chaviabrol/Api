const express = require('express');
const multer = require('multer');
let fs = require("fs");

var videoshow = require('videoshow');
const app = express();
const gTTs = require('gtts');
const {exec} = require('child_process');


// const { stderr } = require('process');

//upload file
app.use('/upload',express.static('uploads'));

const upload = multer({
    storage:multer.diskStorage({
        destination:function(req,file,cb){
            cb(null, "uploads")
        },
        filename: function(req,file,cb){
            cb(null,file.originalname);
        }
    })
});

app.post("/upload_file",upload.single("user_file"),(req,res)=>{
    res.json({
        "status": "ok",
        profile_url: `http://localhost:3000/upload/${req.file.filename}`

    })
});




// Covert text file to audio

app.post("/text_file_to_audio",upload.single("user_file"),(req,res)=>{
    
    fs.readFile(__dirname+"/uploads/"+req.file.filename, function(err, data) {
        if(err) throw err;
        var array = data.toString();
        var gtts = new gTTs(array,'en');
        gtts.save('uploads/sample.mp3',function(err,result){
            if(err){throw new Error(err)}
            
        })
    });
    res.json({
        "status": "ok",
        "message": "text to speech converted",
        profile_url: `http://localhost:3000/upload/sample.mp3`

    })

})

// Merge image and audio

var images = [];

var videoOptions = {
    fps: 25,
    loop: 5, // seconds
    transition: true,
    transitionDuration: 1, // seconds
    videoBitrate: 1024,
    videoCodec: 'libx264',
    size: '640x?',
    audioBitrate: '128k',
    audioChannels: 2,
    format: 'mp4',
    pixelFormat: 'yuv420p'
}

app.post("/merge_image_and_audio",upload.array("user_file","3"),(req,res)=>{
    var fileinfo = req.files;
    
    images[0]= `./uploads/${fileinfo[0].filename}`
    console.log(images[0]);
    
    videoshow(images,videoOptions)
    .audio(`./uploads/${fileinfo[1].filename}`)
    .save("uploads/slideshow.mp4")
    .on('start',function(command){
        console.log("Conversion started" + command)
    })
    .on('error',function(err,stdout,stderr){
        console.log("Some error occured" + err)
    })
    .on('end',function(output){
        console.log("Conversion completed" + output)
    })

    res.json({
        "status": "ok",
        "message": "Video Created Successfully",
        profile_url: `http://localhost:3000/upload/slideshow.mp4`

    });

})


// Merge Video and Audio

app.post("/merge_video_and_audio",upload.array("user_file","3"),(req,res)=>{
    var fileinfo = req.files;
    

    var output = './uploads/video-audio.mp4';
    
    exec(`ffmpeg -i ./uploads/${fileinfo[1].filename} -stream_loop -1 -i ./uploads/${fileinfo[0].filename} -map 0:v -map 1:a -c copy -shortest ${output}`,(err,stderr,stdout)=>{
        if(err){
            console.log(err);
        }
        else{
            console.log("Conversion completed");
        }
    });
    res.json({
        "status": "ok",
        "message": "Video and Audio Merged Successfully",
        profile_url: `http://localhost:3000/upload/video-audio.mp4`

    });
})

// Merge all videos

app.post("/merge_all_video",upload.array("user_file","5"),(req,res)=>{
    var fileinfo = req.files;
    var list = "";
    if(fileinfo){
        req.files.forEach(file =>{

            list += `file ${file.filename}`
            list += "\n"
        });
    }
    var filePath = "./uploads/filetext.txt";
    var writeStream = fs.createWriteStream(filePath)
    writeStream.write(list)
    writeStream.end()

    var outputfilepath = "./uploads/merged-video.mp4";
    
    exec(`ffmpeg -safe 0 -f concat -i ${filePath} -c copy ${outputfilepath}`,(err,stdout) =>{
        if(err) {
            console.log(err);
        }
        else{
            console.log("Merge completed");
        }
    });
    res.json({
        "status": "ok",
        "message": "Merged All Video Successfully",
        profile_url: `http://localhost:3000/upload/merged-video.mp4`

    });
})

// Downloading file

app.get('/download_file/:Id',function(req,res){
    const requestedPostId = req.params.Id;
    
    res.download("./uploads/"+requestedPostId);
    
})
// List of all the uploaded files
app.get('/my_uploaded_file',function(req,res){
    
    fs.readdir("./uploads",(err,files) =>{
        res.json({
            "status": "ok",
            "data": files
    
        });
    });
    
   
})
app.listen(process.env.PORT || 3000, function(){
    console.log("Server started successfully at 3000");
});