class PlacenameGame{
	constructor(apiKey){
		let defaultLanguage = localStorage.getItem("selectedLanguage") === null ? "russian" : localStorage.getItem("selectedLanguage")
		this.apiKey = apiKey
		this.elements = {
			"currentQuestion": document.getElementById("currentQuestion"),
			"audioButton": document.getElementById("audioButton"),
			"lastGuess": document.getElementById("lastGuess"),
			"guessInput": document.getElementById("guessInput"),
			"guessButton": document.getElementById("guessButton"),
			"giveUp": document.getElementById("giveUp")
		}

		this.elements.guessInput.addEventListener("keyup", event => {
			if(event.keyCode == 13){
				this.guess()
			}
		})
		this.elements.guessButton.addEventListener("click", () => this.guess())
		this.elements.giveUp.addEventListener("click", () => this.giveUp())
		this.elements.audioButton.addEventListener("click", () => this.textReader.read(this.elements.currentQuestion.innerHTML))
		let switchers = document.getElementsByClassName("switcher")
		for(let i = 0; i < switchers.length; i++){
			console.log(switchers[i])
			switchers[i].addEventListener("click", () => this.switchLanguage(switchers[i].innerHTML))
		}

		this.switchLanguage(defaultLanguage)
	}

	updateQuestion(){
		this.game.nextQuestion()
		this.elements.currentQuestion.innerHTML = this.game.current[this.game.settings.displayLanguage]
	}

	giveUp(){
		this.elements.lastGuess.innerHTML = `<span class='incorrect'><b>the correct answer for ${this.game.current[this.game.settings.displayLanguage]} was ${this.game.current[this.game.settings.guessLanguage]}</b></span>`
		document.getElementById("guessInput").value = ""
		this.updateQuestion()
	}

	guess(){
		let guessedValue = document.getElementById("guessInput").value
		let correct = this.game.guess(guessedValue)
		if(correct){
			this.elements.lastGuess.innerHTML = `<span class='correct'><b>correct! ${this.game.current[this.game.settings.displayLanguage]} is ${this.game.current[this.game.settings.guessLanguage]}</b></span>`
			this.updateQuestion()
		}
		else{
			this.elements.lastGuess.innerHTML = `<span class='incorrect'>${this.game.current[this.game.settings.displayLanguage]} is not ${guessedValue}</span>` 
		}
		this.elements.guessInput.value = ""
	}

	switchLanguage(language){
		localStorage.setItem("selectedLanguage", language)
		this.elements.currentQuestion.innerHTML = "[loading]"
		fetch(`languages/${language}.json`).then(
			result => result.json()
		).then(
			result => { // i want to add the option to select stuff later, but for now, i just autogenerate things
				let languageOptions = result
				let countries = []
				let placeTypes = ["Q515", "Q3957", "Q532", "Q7930989", "Q486972"] // city, town, village, city/town, human settlement, respectively
				for(let i = 0; i < languageOptions.countries.length; i++){
					if(languageOptions.countries[i].defaultEnabled){
						countries.push(languageOptions.countries[i].code)
					}
				}
				for(let i = 0; i < languageOptions.customPlaceTypes.length; i++){
					if(languageOptions.customPlaceTypes[i].defaultEnabled){
						placeTypes.push(languageOptions.customPlaceTypes[i].code)
					}
				}
				let settings = {"languageCode": languageOptions.languageCode, "textReplacements": languageOptions.textReplacements, "displayLanguage": "local", "countries": countries, "placeTypes": placeTypes}
				this.game = new GameCore(settings)
				this.textReader = new TextReader(result.ttsCode, this.apiKey)
				this.game.load().then(() => this.updateQuestion())
			}
		)
	}

}