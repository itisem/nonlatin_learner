class GameCore{
	constructor(settings){
		this.settings = settings
		this.current = undefined
		this.places = []
		this.textReplacements = {"en": [], "local": []}
		for(let i = 0; i < this.settings.textReplacements.en.length; i++){
			this.textReplacements.en.push(new RegExp(this.settings.textReplacements.en[i], "ui"))
		}
		for(let i = 0; i < this.settings.textReplacements.local.length; i++){
			this.textReplacements.local.push(new RegExp(this.settings.textReplacements.local[i], "ui"))
		}
		if(this.settings.displayLanguage == "en"){
			this.settings.guessLanguage = "local"
		}
		else{
			this.settings.guessLanguage = "en"
		}
		this.query = this.#buildQuery()
		this.current = undefined
	}

	#buildQuery(){
		let instanceQuery = this.#simpleUnion("P31", this.settings.placeTypes) //p31 = instance of
		let countryQuery = this.#simpleUnion("P17", this.settings.countries) // p17 = country
		let query = `SELECT ?label_en ?label_local ?population\n
			WHERE{\n
	  			${instanceQuery}\n
	  			${countryQuery}\n
	  			?place rdfs:label ?label_en filter (lang(?label_en) = "en"). \n
	  			?place rdfs:label ?label_local filter (lang(?label_local) = "${this.settings.languageCode}"). \n
	  			OPTIONAL {\n
	    			?place  wdt:P1082 ?population.\n
	  			}\n
			}\n
			ORDER BY RAND()
			LIMIT 100` // limiting to 100 locations because i don't want to be awful to wikidata
		return query
	}

	#simpleUnion(dataID, data){
		for(let i = 0; i < data.length; i++){
			data[i] = `{?place wdt:${dataID} wd:${data[i]}.}`
		}
		return data.join(" UNION ")
	}

	async load(){
		let encodedQuery = encodeURIComponent(this.query)
		let endpoint = "https://query.wikidata.org/sparql"
		let headers = {'Accept': 'application/sparql-results+json'}
		let url = `${endpoint}?query=${encodedQuery}&timestamp=${Date.now()}`
		let results = await fetch(url, {headers}).then(result => result.json())
		results = results.results.bindings
		this.places = []
		for(let i = 0; i < results.length; i++){
			this.places.push(this.#replacements({"en": results[i].label_en.value, "local": results[i].label_local.value}))
		}
	}

	#replacements(placeInfo){
		for(let key in placeInfo){
			for(let i = 0; i < this.textReplacements[key].length; i++){
				placeInfo[key] = placeInfo[key].replace(this.textReplacements[key][i], "")
				placeInfo[key] = placeInfo[key].split(", ")[0]
			}
		}
		return placeInfo
	}

	nextQuestion(){
		if(this.places.length == 0){
			this.load().then(
				() => this.#nextQuestionUpdate()
			)
		}
		else{
			this.#nextQuestionUpdate()
		}
		return this.current
	}

	#nextQuestionUpdate(){
		this.current = this.places[0]
		this.current.en = this.current.en.toLowerCase()
		this.places.shift()
	}

	guess(guessedValue){
		return this.#simpleTransform(guessedValue) == this.#simpleTransform(this.current[this.settings.guessLanguage])
	}

	#simpleTransform(text){
		return text.replace(" ", "").toLowerCase()
	}
}