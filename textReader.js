class TextReader{
    constructor(language, apiKey){
        this.language = language
        this.apiKey = apiKey
        this.currentAudio = {"text": undefined, "audio": undefined, "language": this.language}
        this.checkServices()
    }

    changeLanguage(language){
        this.language = language
        this.checkServices()
    }

    checkServices(apiKey){
        this.read = undefined
        let speechVoices = window.speechSynthesis.getVoices()
        for(let i = 0; i < speechVoices.length; i++){
            if(speechVoices[i].lang == this.language){
                this.read = this.readSpeechSynthesis
                this.voiceInfo = speechVoices[i]
            }
        }
        if(!this.read){
            this.read = this.readGoogleCloud
        }
    }

    readGoogleCloud(text){
        if(this.currentAudio.text == text && this.currentAudio.language == this.language){
            this.currentAudio.audio.play()
            return
        }
        let data = {
            "audioConfig": {
                "audioEncoding": "MP3"
            },
            "input": {
                "text": text
            },
            "voice": {
                "languageCode": this.language
            }
        }
        let endpoint = `https://content-texttospeech.googleapis.com/v1/text:synthesize?alt=json&key=${this.apiKey}`
        let headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        fetch(endpoint, {"headers": headers, "method": "POST", "body": JSON.stringify(data)}).then(
            response => response.json()
        ).then(
            response => {
                let base64 = response.audioContent
                let dataURI = `data:audio/mp3;base64,${base64}`
                let audio = new Audio()
                audio.src = dataURI
                audio.play()
                this.currentAudio = {"text": text, "language": this.language, "audio": audio}
            }
        )
    }

    readSpeechSynthesis(text){
        let utterance = new SpeechSynthesisUtterance(text)
        utterance.voice = this.voiceInfo
        window.speechSynthesis.speak(utterance)
    }
}