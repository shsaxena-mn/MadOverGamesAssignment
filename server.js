const {MongoClient, ObjectID} = require('mongodb');
const express = require('express');
const _ =require('lodash');
const bodyParser = require('body-parser');

const port = process.env.PORT || 3000;
const app = express();
app.use(bodyParser.json());


const sortScore = (property) => {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return  (a,b) => {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }   
}

// start your code here
app.get('/getFriendsScore',  (req,res) => {

    MongoClient.connect('mongodb://localhost:27017/local', (err, db) => {
  if (err) {
    return console.log('Unable to connect to MongoDB server');
  }
  console.log('Connected to MongoDB server');

  let gameId = req.body.GameId;
  let socialIds = req.body.SocialIds; //get all social id from user.
      
  let PromisedUserId=socialIds.map(element => { 
      
            return new Promise((resolve, reject)=> { //returns a promise to query db for each user
                db.collection('SocialMap')
                .find({ SocialId: element })
                .toArray(function(err, result) {
                      if (err) {
                          reject(new Error(err));
                      }
                     
                      if(result.length===0){
                        reject(new Error('SocialIds does not exist'));
                      }
                      if(result.length!=0){ 
                        resolve(result[0].UserId); 
                      } 
       });
      
   });

});

Promise.all(PromisedUserId).then(function(results) {
   
    let userIds = results.sort(); // to sort user ids,
    console.log(userIds);
    
    return Promise.all(userIds.map(function(element) {
      
            return new Promise((resolve, reject)=> {
                db.collection('Score')
                .find({ UserId: element })
                .toArray(function(err, result) {
                      if (err) {console.log(err);reject(new Error(err));}
                      
                      let scoreAry=[];
                      for(let i=0 ; i< result.length ; i++){
                           
                          let scores = _.pick(result[i], ['UserId','Level','GameId','Score']);
                          scoreAry.push(scores);
                      };
                      scoreAry.sort(sortScore("Level")); // sort the score object 
                      resolve(scoreAry);  
       });
      
     });
    })
    );
    
} , (err) => { throw new Error('Social Id does nott exist');}).then((finalResult)=>{
  
   if(finalResult!=undefined){
    let Score= [];
    for(let i=0 ; i<finalResult.length;i++){
        let res= finalResult[i];
        for(let j=0 ; j< res.length;j++){
            Score.push(res[j]);
        }
    }
    res.status(200).send(Score); 
    }else{
        throw new Error('Unable to get the score.');
    }
    
   

    

    db.close();//closing db connection
    
} ).catch((e)=> {
    res.status(400).send('Unable to get the score.');
});;





});//mongo client ends here

});//app get ends here


app.listen(port , () => {
    console.log(`App is up on ${port}`);
});
























