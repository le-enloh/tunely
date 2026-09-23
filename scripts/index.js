let chosenSong = ""
let wordLength = 0
let currentRow = 0
let currentTile = 0
let guesses = 6
const hintBox = document.getElementById("hintBox")
const hintBtn = document.getElementById("hintBtn")
const hintTimer = document.getElementById("hintTimer")
const keyboard = document.getElementById("keyboard")
let hintCountdownInterval
let isAnimating = false

// Local hints keep the game working when gamePage.htm is opened with file://.
const songHints = {
  "Focus": "To direct your attention or effort toward one particular thing.",
  "Needy": "Wanting or requiring more attention and support than usual.",
  "Piano": "A large musical instrument played using black and white keys.",
  "Adore": "To love and admire someone or something deeply.",
  "Ghostin": "Being emotionally absent or suddenly ending communication.",
  "Faith": "Strong trust or confidence in someone or something.",
  "Nasty": "Very unpleasant, offensive, or unkind.",
  "Intro": "A short opening section that begins a song or work.",
  "Imagine": "To form a picture or idea in your mind.",
  "Greedy": "Wanting more of something than is needed or fair.",
  "Teeth": "The hard white structures in the mouth used for biting.",
  "Vapor": "A substance floating in the air in a gas-like form.",
  "Easier": "Requiring less effort or difficulty.",
  "Babylon": "An ancient city and empire in Mesopotamia.",
  "Amnesia": "A loss of memory caused by illness, injury, or shock.",
  "Money": "Coins or notes used to buy goods and services.",
  "Older": "Having lived or existed for a longer time.",
  "Caramel": "A sweet brown substance made by heating sugar.",
  "More": "A greater amount, number, or degree.",
  "High": "Extending a long way upward or above the ground.",
  "Lover": "A person who loves another person romantically.",
  "Peace": "A state of calm without conflict or disturbance.",
  "Exile": "Being forced to live away from one's home or country.",
  "Clean": "Free from dirt, marks, or unwanted substances.",
  "Betty": "A feminine given name.",
  "Style": "A distinctive way in which something is done or presented.",
  "Dress": "A one-piece item of clothing, or the act of putting on clothes.",
  "Karma": "The idea that a person's actions shape their future consequences.",
  "Mean": "To intend, signify, or be unkind, depending on context.",
  "Mine": "Something belonging to me, or a place where minerals are extracted."
}

// Hint Availabity Countdown & Display
function startHintCountdown(waitTime = 120000) {

  // Clear any existing countdown
  if (hintCountdownInterval) {
    clearInterval(hintCountdownInterval)
  }
  
  // Reset and disable hint button
  hintBtn.disabled = true
  hintBtn.classList.add("disabled")

  const endTime = Date.now() + waitTime

  const updateTimer = function() {
    const remaining = endTime - Date.now()

    if (remaining <= 0) {
      hintBtn.disabled = false
      hintBtn.classList.remove("disabled")
      hintTimer.textContent = ""
      clearInterval(hintCountdownInterval)
      hintCountdownInterval = null
      return
    }

    const minutes = Math.floor(remaining / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)
    hintTimer.textContent = "(" + minutes + ":" + (seconds < 10 ? "0" + seconds : seconds) + ")"
  }

  updateTimer()
  hintCountdownInterval = setInterval(updateTimer, 1000)
}

// Keyboard UI
function createKeyboard() {
    const keyboard = document.getElementById("keyboard")
    keyboard.innerHTML = ""

    const rows = [
      ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
      ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
      ["Delete", "Z", "X", "C", "V", "B", "N", "M", "Enter"]
    ]
  
    rows.forEach(row => { //row refers to each array/row in "rows"
      const rowDiv = document.createElement("div") //for each row, a new div is created
      rowDiv.classList.add("keyboard-row")
  
      // Creating keys for each row
      row.forEach(key => { //key refers to each element from the current row
        const keyButton = document.createElement("button")
        keyButton.textContent = key
        keyButton.classList.add("key") //add CSS class "key" to the button
        keyButton.setAttribute("data-key", key) //for easy targetting later
  
        // Make Enter and Delete bigger
        if (key === "Enter" || key === "Delete") {
          keyButton.classList.add("special-key")
        }
  
        rowDiv.appendChild(keyButton) //add keys to the rows
      })
  
      keyboard.appendChild(rowDiv) //add rows to the keyboard
    })
  }

// Load Random Song for each Round & Generate Appropriate no. of Tiles
function loadSongs(artist) {
    const songList = {
      "Ariana Grande": ["Focus", "Needy", "Piano", "Adore", "Ghostin", "Faith", "Nasty", "Intro", "Imagine", "Greedy"],
      "5SOS": ["Teeth", "Vapor", "Easier", "Babylon", "Amnesia", "Money", "Older", "Caramel", "More", "High"],
      "Taylor Swift": ["Lover", "Peace", "Exile", "Clean", "Betty", "Style", "Dress", "Karma", "Mean", "Mine"]
    }
  
    const words = songList[artist] || []
    const guesses = 6
    chosenSong = words[Math.floor(Math.random() * words.length)]
    wordLength = chosenSong.length

    console.log("Target song: " + chosenSong)

    createKeyboard()
    const keyboard = document.getElementById("keyboard")

    const gameBoard = document.getElementById("gameBoard")
    gameBoard.innerHTML = ""

    for (let row = 0; row < guesses; row++) {
        const rowDiv = document.createElement("div") //create new div for every row
        rowDiv.classList.add("row") //add row styling

        for (let col = 0; col < wordLength; col++) {
            const tile = document.createElement("div") 
            tile.classList.add("tile") //add tile styling
            tile.setAttribute("id", "tile-" + row + "-" + col) // set id for each tile for easy targetting later

            // Add front and back of tiles for flip effect
            tile.innerHTML = `
              <div class="tile-inner">
                <div class="tile-front"></div>
                <div class="tile-back"></div>
              </div>
            `
            rowDiv.appendChild(tile) //add tiles to a row
        }

        gameBoard.appendChild(rowDiv) //add rows with tiles to the game board
    }
  
    return chosenSong
  }

// Helper function to check for invalid words
async function isValidWord(word) {
  // A file:// page cannot reliably call the online dictionary because of
  // browser cross-origin restrictions. Allow the guess so play can continue.
  if (window.location.protocol === "file:") return true

  const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
  return response.ok
}

async function checkGuess() {
  const guess = getGuessFromTiles()
  const guessWord = guess.join("").toUpperCase()
  const target = chosenSong.toUpperCase()
  
  // First check if it's the correct answer - bypass dictionary check
  if (guessWord === target) {
    const result = getGuessResult(guess, target)
    animateTiles(guess, result)
    updateKeyboardAfterDelay(guess, result)
    currentRow++
    currentTile = 0
    checkGameEnd(guessWord, target)
    return
  }
  
  // Only check dictionary for non-matching answers
  try {
    const isWord = await isValidWord(guessWord.toLowerCase())
    if (!isWord) return handleInvalidWord()
  } catch (error) {
    // Do not freeze the game when the external dictionary is unavailable.
    console.warn("Could not validate the guess:", error)
    showNotification("Dictionary unavailable - accepting this guess.", 2500)
  }
  
  const result = getGuessResult(guess, target)
  animateTiles(guess, result)
  updateKeyboardAfterDelay(guess, result)
  currentRow++
  currentTile = 0
  checkGameEnd(guessWord, target)
}

function getGuessFromTiles() {
  const guess = []
  for (let col = 0; col < chosenSong.length; col++) {
    const tile = document.getElementById(`tile-${currentRow}-${col}`)
    const front = tile.querySelector(".tile-front")
    guess.push(front.textContent.trim())
  }
  return guess
}

function handleInvalidWord() {
  showNotification("That's not a valid English word!", 2000)
  for (let col = 0; col < chosenSong.length; col++) {
    const tile = document.getElementById(`tile-${currentRow}-${col}`)
    const front = tile.querySelector(".tile-front")
    front.textContent = ""
  }
  currentTile = 0
  isAnimating = false
}

function getGuessResult(guess, target) {
  const result = Array(guess.length).fill("absent")
  const targetLetterCount = {}
  for (let letter of target) {
    targetLetterCount[letter] = (targetLetterCount[letter] || 0) + 1
  }
  
  // First pass: mark correct letters
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === target[i]) {
      result[i] = "correct"
      targetLetterCount[guess[i]]--
    }
  }
  
  // Second pass: mark present letters
  for (let i = 0; i < guess.length; i++) {
    if (result[i] === "correct") continue
    if (targetLetterCount[guess[i]] > 0) {
      result[i] = "present"
      targetLetterCount[guess[i]]--
    }
  }
  
  return result
}

function animateTiles(guess, result) {
  for (let i = 0; i < guess.length; i++) {
    const tile = document.getElementById(`tile-${currentRow}-${i}`)
    const back = tile.querySelector(".tile-back")
    tile.classList.add("flip")
    setTimeout(() => {
      back.textContent = guess[i]
      back.classList.add(result[i])
    }, i * 300 + 300)
  }
}

function updateKeyboardAfterDelay(guess, result) {
  setTimeout(() => {
    const bestStatus = {}
    for (let i = 0; i < guess.length; i++) {
      const letter = guess[i]
      const status = result[i]
      const existing = bestStatus[letter]
      if (status === "correct" || 
         (status === "present" && existing !== "correct") ||
         (status === "absent" && !existing)) {
        bestStatus[letter] = status
      }
    }
    
    for (const letter in bestStatus) {
      const key = document.querySelector(`.key[data-key="${letter}"]`)
      if (key) {
        key.classList.remove("correct", "present", "absent")
        key.classList.add(bestStatus[letter])
      }
    }
    
    isAnimating = false
  }, guess.length * 300 + 300)
}

function checkGameEnd(guessWord, target) {
  if (guessWord === target) {
    setTimeout(() => {
      showOverlay("You won! Want to play again?", { showPlayAgain: true })
    }, 2500)
  } else if (currentRow === guesses) {
    setTimeout(() => {
      showOverlay(`You're out of guesses! The song was: **${chosenSong}**`, { showPlayAgain: true })
    }, 2500)
  }
}

// Input Letters in Tiles
function handleKeyInput(key) {

  // Block input while animating
  if (isAnimating) return

  if (/^[A-Z]$/.test(key)) {
    if (currentTile < chosenSong.length) {
      const tile = document.getElementById("tile-" + currentRow + "-" + currentTile)
      const front = tile.querySelector(".tile-front")
      front.textContent = key
      currentTile++
    }
    
  }

  // Handle Delete
  if (key == "Delete") {
    if (currentTile > 0) {
      currentTile--
      const tile = document.getElementById("tile-" + currentRow + "-" + currentTile)
      const front = tile.querySelector(".tile-front")
      front.textContent = ""
    }
  }

// Handle Enter
if (key == "Enter") {
  if (currentTile === chosenSong.length) {
    isAnimating = true
    checkGuess().catch(error => {
      console.error("Could not process the guess:", error)
      isAnimating = false
      showNotification("Something went wrong. Please try again.", 3000)
    })
  } else {
    showNotification("Not enough letters!", 2000)
  }
}
}

// Add Event Listeners
keyboard.addEventListener("click", function(event) {
  if (event.target.matches("button.key")) {
    const key = event.target.getAttribute("data-key");
    handleKeyInput(key)
  }
})

// Show Hint function
async function showHint(word) {
  const localHint = songHints[word]
  if (localHint) {
    showOverlay("Hint: " + localHint, {
      showHome: false,
      showClose: true
    })
    return true
  }

  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`)
    if (!response.ok) throw new Error(`Dictionary returned ${response.status}`)

    const data = await response.json()
    const meaning = data?.[0]?.meanings?.[0]?.definitions?.[0]?.definition

    if (!meaning) throw new Error("No definition found")

    showOverlay("Hint: " + meaning, {
      showHome: false,
      showClose: true
    })
    return true
  } catch (error) {
    console.warn("Could not load a hint:", error)
    showNotification("Hint unavailable right now. Please try again.", 5000)
    return false
  }
}

// Hint Button
hintBtn.addEventListener("click", async () => {
  // Check daily limit first
  const today = new Date().toISOString().split("T")[0]
  const usedHints = JSON.parse(localStorage.getItem("dailyHints") || "{}")

  if (!usedHints[today]) {
    usedHints[today] = 0
  }

  if (usedHints[today] >= 3) {
    showNotification("You've reached your 3 hints for today.", 2000)
    return
  }

  // Only count the hint after it has loaded successfully.
  const hintWasShown = await showHint(chosenSong)
  if (hintWasShown) {
    usedHints[today]++
    localStorage.setItem("dailyHints", JSON.stringify(usedHints))
  }
})

const resetBtn = document.getElementById("resetBtn")
const confirmResetOverlay = document.getElementById("confirmResetOverlay")
const confirmResetBtn = document.getElementById("confirmResetBtn")
const cancelResetBtn = document.getElementById("cancelResetBtn")
const artistOverlay = document.getElementById("choiceOverlay")

// Trigger Reset Game Confirmation Pop up 
resetBtn.addEventListener("click", function() {
  confirmResetOverlay.style.display = "flex"
})

// Reset the Game
confirmResetBtn.addEventListener("click", function() {
  // Clear artist selected
  localStorage.removeItem("selectedArtist")

  // Clear hint tracking
  localStorage.removeItem("dailyHints")

  chosenSong = ""
  currentRow = 0
  currentTile = 0
  isAnimating = false

  // Show artist selection
  artistOverlay.style.display = "block"

  // Close confirmation
  confirmResetOverlay.style.display = "none"
})

// Cancel reset
cancelResetBtn.addEventListener("click", function() {
  confirmResetOverlay.style.display = "none"
})

// Reusable Show Notification function
function showNotification(message, duration) {
  const note = document.createElement("div")
  note.classList.add("notification", "shake")
  note.textContent = message

  document.body.appendChild(note)

  // Remove shake class after animation ends
  note.addEventListener("animationend", () => {
    note.classList.remove("shake")
  })

  setTimeout(() => {
    note.classList.add("fade-out")
    // Remove from DOM after fade-out finishes
    setTimeout(() => {
      note.remove()
    }, 1000);
  }, duration);
}

// Reusable Show Overlay Function
function showOverlay(message, options = {}) {
  const {
    callback,
    showPlayAgain = false,
    showHome = true,
    showClose = false
  } = options

  const overlay = document.getElementById("customOverlay")
  const messageBox = document.getElementById("overlayMessage")
  const overlayHomeBtn = document.getElementById("overlayHomeBtn")
  const playAgainBtn = document.getElementById("overlayPlayAgainBtn")
  const closeBtn = document.getElementById("overlayCloseBtn")

  messageBox.innerHTML = message
  overlay.style.display = "flex"

  // Hide Play Again Btn unless needed
  playAgainBtn.style.display = showPlayAgain ? "inline-block" : "none"

  // Hide Home Btn unless needed
  overlayHomeBtn.style.display = showHome ? "inline-block" : "none"

  // Hide Close Btn unless needed
  closeBtn.style.display = showClose ? "inline-block" : "none"

  overlayHomeBtn.onclick = () => {
    overlay.style.display = "none"
    window.location.href = "./index.html"
  }

  playAgainBtn.onclick = () => {
    overlay.style.display = "none"
    const artist = localStorage.getItem("selectedArtist")
    if(artist) {
      // Reset game state
      currentRow = 0
      currentTile = 0
      chosenSong = ""
      wordLength = 0
      isAnimating = false

      // Clear preious game board and keyboard UI
      document.getElementById("gameBoard").innerHTML = ""
      document.getElementById("keyboard").innerHTML = ""

      // Load a new song and restart
      loadSongs(artist)
      startHintCountdown()
    }
  }

  closeBtn.onclick = () => {
    overlay.style.display = "none"
    if (typeof callback === "function") {
      callback()
    }
  }
}

function selectArtist(artistName) {
  localStorage.setItem('selectedArtist', artistName)
  artistOverlay.style.display = "none"
  loadSongs(artistName)
  startHintCountdown()
}

window.onload = function () {
  const selectedArtist = localStorage.getItem("selectedArtist")

  if(selectedArtist) {
    loadSongs(selectedArtist)
    startHintCountdown()
  } else {
    artistOverlay.style.display = "flex"
  }
}








