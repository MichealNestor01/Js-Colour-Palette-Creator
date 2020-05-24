//Created by Micheal Nestor -> michealnestor@outlook.com
//This is the javascript file that controlls the functionality behind the color palettes project

//Element selections and variables:
const colorDivs = document.querySelectorAll(".color");
const generateButton = document.querySelector(".generate");
const sliders = document.querySelectorAll('input[type="range"]');
const currentHexH2s = document.querySelectorAll(".color h2");
const popup = document.querySelector(".copy-container");
const adjustButton = document.querySelectorAll(".adjust");
const closeAdjust = document.querySelectorAll(".close-adjustments");
const sliderContainer = document.querySelectorAll(".sliders");
const lockButton = document.querySelectorAll(".lock");
let initialColors;
let hues;

//This is for local storage
let savedPalettes = [];

//Event listeneners:

//If someone clicks any of the sliders
sliders.forEach((slider) => {
  slider.addEventListener("input", hslControls);
});

//This checks for a change being made in the background of each div and then updates the hex-code accordingly
colorDivs.forEach((div, index) => {
  div.addEventListener("change", () => {
    updateTextUi(index);
  });
});

//This loop adds an event listner to all of the hex-codes, that runs the function copytoclipboard and passes the hex that was clicked
currentHexH2s.forEach((hex) => {
  hex.addEventListener("click", () => {
    copyToClipboard(hex);
  });
});

//This makes the copy confirmation popup dissapear a few seconds after it pops u
popup.addEventListener("transitionend", () => {
  const popupBox = popup.children[0];
  popupBox.classList.remove("active");
  popup.classList.remove("active");
});

//This this loop adds functionality too all of adjustment buttons and the close buttons
adjustButton.forEach((button, index) => {
  button.addEventListener("click", () => {
    adjustmentPanelToggle(index);
  });
  closeAdjust[index].addEventListener("click", () => {
    adjustmentPanelToggle(index);
  });
});

//this makes clicking the generate button generate a new color for all of the unlocked colors
generateButton.addEventListener("click", () => {
  randomColors();
});

//this loop makes all of the lock buttons call the lockColor() function
lockButton.forEach((button, index) => {
  button.addEventListener("click", () => {
    lockColor(index);
  });
});

//functions:

//Color Generator:
function generateHex() {
  //uses the chroma-js library to genereate a random color
  const hexColor = chroma.random();
  return hexColor;
}

//function to update the color div's background
function randomColors() {
  //empty the hues and initialColors arrays
  hues = [];
  initialColors = [];
  colorDivs.forEach((div) => {
    //selects the h2 of the color div selected
    const hexText = div.children[0];

    //generates a random hex code
    const randomColor = generateHex();

    //add text to initial array
    if (div.classList.contains("locked")) {
      //if the div is locked, dont change the color
      initialColors.push(hexText.innerText);
      return;
    } else {
      //add a new color to the colors array
      initialColors.push(randomColor.hex());
    }

    //add color to the div's background
    div.style.backgroundColor = randomColor;
    hexText.innerText = randomColor;

    //check contrast (this makes sure that the hex code and buttons are visible over all colours)
    checkTextContrast(randomColor, hexText);
    const icons = div.querySelectorAll(".controls button");
    for (icon of icons) {
      checkTextContrast(randomColor, icon);
    }

    //initial colorise sliders
    updateSlider(randomColor, div);
  });
}

//I made this function because I was repeating this section of code in two function
function updateSlider(color, colorDiv) {
  const sendColor = chroma(color);
  const sliders = colorDiv.querySelectorAll(".sliders input");
  const hue = sliders[0];
  const brightness = sliders[1];
  const saturation = sliders[2];
  hues.push(hue.value);
  coloriseSliders(sendColor, hue, brightness, saturation);
}

//This function udates the colours in all of the sliders
function coloriseSliders(color, hue, brightness, saturation) {
  //scale saturation value
  const minSat = color.set("hsl.s", 0);
  const maxSat = color.set("hsl.s", 1);
  const satScale = chroma.scale([minSat, color, maxSat]);
  hslValues = color.hsl();
  hue.value = Math.round(hslValues[0]);
  saturation.value = Math.round(hslValues[1] * 100) / 100;
  brightness.value = Math.round(hslValues[2] * 100) / 100;

  //scale the brightness value
  const midBright = color.set("hsl.l", 0.5);
  const brightScale = chroma.scale(["black", midBright, "white"]);

  //Update the slider's background in accordance with the backround color
  //prettier-ignore
  saturation.style.backgroundImage = `linear-gradient(to right,${satScale(0)}, ${satScale(0.5)}, ${satScale(1)})`
  //prettier-ignore
  brightness.style.backgroundImage = `linear-gradient(to right,${brightScale(0)}, ${brightScale(0.5)}, ${brightScale(1)})`
  //prettier-igore
  hue.style.backgroundImage = `linear-gradient(to right, rgb(255, 0, 0), rgb(255,255 ,0),rgb(0, 255, 0),rgb(0, 255, 255),rgb(0,0,255),rgb(255,0,255),rgb(255,0,0))`;
}

//check constrast of text agaisnt its background
function checkTextContrast(color, element) {
  //lumninance is a chroma-js function that checks the brightness of a color
  const luminance = chroma(color).luminance();
  //if the luminance is > 0.5 then it will be easier to see the default text color
  //else it will be easier to see white.
  if (luminance > 0.5) {
    element.style.color = "#322e2f";
  } else {
    element.style.color = "white";
  }
}

//This function updates the background when a slider's value is changed by a user.
function hslControls(event) {
  //Index identifies which color div needs to be updated
  const index =
    event.target.getAttribute("data-bright") ||
    event.target.getAttribute("data-sat") ||
    event.target.getAttribute("data-hue");
  //The next few lines get all of the slider values
  //prettier-ignore
  let sliders = event.target.parentElement.querySelectorAll('input[type="range"]');
  const hue = sliders[0];
  const brightness = sliders[1];
  const saturation = sliders[2];
  const bgColor = initialColors[index];
  //The next line updates the background color to the new color dictated by the change in the sliders value
  let color = chroma(bgColor)
    .set("hsl.s", saturation.value)
    .set("hsl.l", brightness.value)
    .set("hsl.h", hue.value);
  //Update the background color
  colorDivs[index].style.backgroundColor = color;
  //This updates the background colour of the adjustment sliders
  if (hues[index].value != hue.value) {
    coloriseSliders(color, hue, brightness, saturation);
  }
}

//This function updates the hex value in the given color div
function updateTextUi(index) {
  const activeDiv = colorDivs[index];
  const color = chroma(activeDiv.style.backgroundColor);
  textHex = activeDiv.querySelector("h2");
  const icons = activeDiv.querySelectorAll(".controls button");
  textHex.innerText = color.hex();
  //check the contrast for the text and icons
  checkTextContrast(color, textHex);
  for (icon of icons) {
    checkTextContrast(color, icon);
  }
}

//This function adds the hex code you clicked on to the users clipboard
function copyToClipboard(hex) {
  const element = document.createElement("textarea");
  element.value = hex.innerText;
  document.body.appendChild(element);
  element.select();
  document.execCommand("copy");
  document.body.removeChild(element);
  //confirmation popup animation
  const popupBox = popup.children[0];
  popupBox.classList.add("active");
  popup.classList.add("active");
}

//this function just toggles the active class on the sliders panel
function adjustmentPanelToggle(index) {
  sliderContainer[index].classList.toggle("active");
}

//this function allows users to lock a color if they like it, so it wont be changed when they generant new colors
function lockColor(index) {
  colorDivs[index].classList.toggle("locked");
  lockButton[index].children[0].classList.toggle("fa-lock-open");
  lockButton[index].children[0].classList.toggle("fa-lock");
}

//implemention save palet and local storage
//I separated this section of the code because it is easier for me to manage

//element selectors and variables
const saveButton = document.querySelector(".save");
const submitSave = document.querySelector(".submit-save");
const closeSave = document.querySelector(".close-save");
const saveContainer = document.querySelector(".save-container");
const saveInput = document.querySelector(".save-name");
const paletteVisualiser = document.querySelector(".palette-container");
const libraryContainer = document.querySelector(".library-container");
const libraryButton = document.querySelector(".library");
const closeLibrary = document.querySelector(".close-library");

//event listeners
saveButton.addEventListener("click", toggleSave);
closeSave.addEventListener("click", toggleSave);
submitSave.addEventListener("click", savePalettes);
libraryButton.addEventListener("click", toggleLibrary);
closeLibrary.addEventListener("click", toggleLibrary);

//this function toggles the save popup window
function toggleSave(event) {
  const popup = saveContainer.children[0];
  saveContainer.classList.toggle("active");
  popup.classList.toggle("active");
  setPaletteVisualiser();
}

//this is the function that saves user's palettes
function savePalettes(event) {
  //it closes the save window
  saveContainer.classList.remove("active");
  popup.classList.remove("active");
  //then it creates a palette object with the saved name and all the colors
  const name = saveInput.value;
  const colors = [];
  currentHexH2s.forEach((hex) => {
    colors.push(hex.innerText);
  });
  let paletteNumber = savedPalettes.length;
  const paletteObj = { name, colors, number: paletteNumber };
  savedPalettes.push(paletteObj);
  //save to local storage
  saveToLocal(paletteObj);
  saveInput.value = "";
  //generate palette in the library window
  generateLibraryElement(paletteObj);
}

//this funtion is used to create new library elements
function generateLibraryElement(paletteObject) {
  //first all of the elements are made and their classes are added
  const palette = document.createElement("div");
  palette.classList.add("custom-palette");
  const title = document.createElement("h4");
  title.innerText = paletteObject.name;
  const preview = document.createElement("div");
  preview.classList.add("palette-container");
  //this loop formats the preview for the plaette
  paletteObject.colors.forEach((smallColor) => {
    const smallDiv = document.createElement("div");
    smallDiv.style.backgroundColor = smallColor;
    smallDiv.classList.add("palette-color");
    preview.appendChild(smallDiv);
  });
  const paletteButton = document.createElement("button");
  paletteButton.classList.add("pick-palette-button");
  paletteButton.classList.add(paletteObject.number);
  paletteButton.innerText = "select";
  //this function runs on the click of a button and loads the selected palette
  paletteButton.addEventListener("click", (event) => {
    toggleLibrary();
    const paletteIndex = savedPalettes.indexOf(paletteObject);
    initialColors = [];
    hues = [];
    savedPalettes[paletteIndex].colors.forEach((color, index) => {
      initialColors.push(color);
      colorDivs[index].style.backgroundColor = color;
      const hexText = colorDivs[index].children[0];
      checkTextContrast(color, hexText);
      updateTextUi(index);
      updateSlider(color, colorDivs[index]);
    });
  });
  //append all of the palette objects to the palette
  palette.appendChild(title);
  palette.appendChild(preview);
  palette.appendChild(paletteButton);
  //add the palette to the library
  libraryContainer.children[0].appendChild(palette);
}

//this function allows users to see a small version of the palette they are saving
function setPaletteVisualiser() {
  colorDivs.forEach((div, index) => {
    //prettier-ignore
    paletteVisualiser.children[index].style.backgroundColor = div.style.backgroundColor;
  });
}

//this function saves a given palette object to local storage
function saveToLocal(object) {
  let localPalettes;
  //first it checks if local storage has anything and if it does it loads what it has
  if (localStorage.getItem("palettes") == null) {
    localPalettes = [];
  } else {
    localPalettes = JSON.parse(localStorage.getItem("palettes"));
  }
  //then it adds the new object to the palettes array and overwrites local storage
  localPalettes.push(object);
  localStorage.setItem("palettes", JSON.stringify(localPalettes));
}

//toggle library causes the library window to appear and dissapear
function toggleLibrary() {
  //if the library is being opened for the first time then it will load all of the palettes in local storage
  if (libraryContainer.children[0].children.length === 2) {
    getLocal();
  }
  const popup = libraryContainer.children[0];
  libraryContainer.classList.toggle("active");
  popup.classList.toggle("active");
}

//get local retrieves all of the palettes in local storage and adds them to the library
function getLocal() {
  //it only tries to format the library if there is anything in local storage
  if (localStorage.getItem("palettes") === null) {
    localPalettes = [];
  } else {
    const paletteObjects = JSON.parse(localStorage.getItem("palettes"));
    paletteObjects.forEach((object) => {
      savedPalettes.push(object);
      generateLibraryElement(object);
    });
  }
}

//random colours generates a random palette when the webpage is loaded
randomColors();
