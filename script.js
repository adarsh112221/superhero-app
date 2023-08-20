
document.addEventListener("DOMContentLoaded", function() {


// all the variable used 
let favdata=JSON.parse(localStorage.getItem('likedCharacters')) || [];
let favurl='';
let currurl='';
let favdatacontent=[];
const abortControllers = []; 
const cardContainer = document.getElementById('card-box');
const heroContainer = document.getElementById('herocontainer');
const cardTemplate = document.getElementById('card-template');
const heroTemplate = document.getElementById('character-details');
let searchbar=document.getElementById('search-bar');
let searchList=document.getElementById('search-data');
let searchlistul=document.getElementById('search-data-list')
const publicKey = 'ef956e98431770feabdccc9fbfc027c4';
const privateKey = 'fedf000b9eb7e77382b3966652df4b203a9e865e';
const timestamp = new Date().getTime();
const hash = (CryptoJS.MD5(timestamp + privateKey + publicKey));
const apiUrl = 'https://gateway.marvel.com/v1/public/characters';
const fullUrl = `${apiUrl}?ts=${timestamp}&apikey=${publicKey}&hash=${hash}&limit=100`;
const homeLink = document.getElementById("home-link");
const favLink = document.getElementById("fav-link");
let isThrottled = false;
let abortController=null;
let signal=null;




pushcontent(fetchData(fullUrl));   //initial request


// fetching initial data
async function fetchData(Url,signal){
try{
cardContainer.innerHTML='';
let response=await fetch(Url,{signal});
let data=await response.json();
let cardData=data.data.results;
return cardData;
}catch{
throw new Error("ab kya hi btau bhai galat seen ho gya");
}
}


//pushing the data into the html
async function pushcontent(cardData){
cardContainer.innerHTML='';
cardData=await cardData;
cardData.forEach(data =>{
const cardClone = cardTemplate.content.cloneNode(true);
const card = cardClone.querySelector('.card');
const cardImage = cardClone.querySelector('.card-image');
const cardTitle = cardClone.querySelector('.card-title');
const cardContent = cardClone.querySelector('.card-content');
const fav_button=cardClone.querySelector('i.heartelement');
cardImage.src = data.thumbnail.path+"."+data.thumbnail.extension;
card.dataset.id=data.id;
if(favdata.find((ele)=> ele==data.id))
fav_button.classList.add('clickedicon');
cardTitle.textContent = data.name;
cardContainer.appendChild(cardClone);
});
}

//get fav-data from the api and pushing it into
async function getfavdata(signal){
favdatacontent = favdata.map(async id =>{
favurl=`${apiUrl}/${Number(id)}?ts=${timestamp}&apikey=${publicKey}&hash=${hash}`;
let curr_data=await fetchData(favurl,signal);
return await curr_data[0];
});
favdatacontent=await Promise.all(favdatacontent);
return favdatacontent;
}

//throttle to reduce api calls
function throttle(func, delay) {
    return async function() {
      if (!isThrottled) {
        let content=await func.apply(this, arguments);
        pushcontent(content);
        isThrottled = true;
        setTimeout(() => {
        isThrottled = false;
        }, delay);
      }
    };
}


// show detials of the superhero
async function showdetails(id){
const clonehero = heroTemplate.content.cloneNode(true);
const comicsOl = clonehero.getElementById('comicsOl');
const seriesOl = clonehero.getElementById('seriesOl');
let heroimage=clonehero.querySelector('.character-image>img')
let name=clonehero.querySelector('#charName');
let description=clonehero.querySelector('#description')
//get the data and make the template visible on the home screen
currurl=`${apiUrl}/${Number(id)}?ts=${timestamp}&apikey=${publicKey}&hash=${hash}`;
heroContainer.innerHTML='';
let data=await fetchData(currurl);
console.log(data)
name.innerHTML='Name:'+data[0].name;
description.innerHTML='About:'+data[0].description;
heroimage.src=data[0].thumbnail.path+"."+data[0].thumbnail.extension;
data[0].comics.items.forEach(comic => {
const listItem = document.createElement('li');
listItem.textContent = comic.name;
comicsOl.appendChild(listItem);
});

data[0].series.items.forEach(series => {
const listItem = document.createElement('li');
listItem.textContent = series.name;
seriesOl.appendChild(listItem);
});
console.log(clonehero)
console.log(heroContainer)
heroContainer.appendChild(clonehero);
}


//recommending data based on the keypress
searchbar.onkeyup = async function(event){
let userData = event.target.value;
if(userData.length==0){
searchList.style.display = 'none'
}
else{
searchList.style.display =' block'
let search_url =`${apiUrl}?nameStartsWith=${userData}&ts=${timestamp}&apikey=${publicKey}&hash=${hash}`;
let searchdata=await fetch(search_url);
searchdata=await searchdata.json();
searchdata=searchdata.data.results;
console.log(searchdata)
searchlistul.innerHTML='';
searchdata.forEach(character => {
const characterDiv = document.createElement('li');
characterDiv.className = 'character';
characterDiv.dataset.id=character.id;
characterDiv.innerHTML = `
<img style="height:100px; width:100px;" src="${character.thumbnail.path}.${character.thumbnail.extension}" alt="${character.name}">
<h2 style="color:white;padding:5px;">${character.name}</h2> 
`;
searchlistul.appendChild(characterDiv);
});
}
}


//event listner to get the data
document.addEventListener("click",function(e){

//canceling multiple request just trying it out
abortControllers.forEach(controller => controller.abort());
const controller = new AbortController();
const signal = controller.signal;
abortControllers.push(controller);
searchList.style.display = 'none'

if(e.target==homeLink){
cardContainer.innerHTML='';
e.preventDefault();
throttle(fetchData,300)(fullUrl,signal);
}



if(e.target==favLink){
cardContainer.innerHTML='';
e.preventDefault();
card
throttle(getfavdata,300)(signal)
}


if(Array.from(e.target.classList).includes('heartelement')){
e.target.classList.toggle('clickedicon');
let curr_id=e.target.closest('[data-id]').dataset.id;
const characterIndex = favdata.indexOf(curr_id);
if(Array.from(e.target.classList).includes('clickedicon')){
favdata.push(curr_id);
localStorage.setItem('likedCharacters', JSON.stringify(favdata));
}else{
favdata.splice(characterIndex, 1);
localStorage.setItem('likedCharacters', JSON.stringify(favdata));
}
}
if(e.target.classList.contains('card-content')){
showdetails(e.target.closest('[data-id]').dataset.id);
}
})


});