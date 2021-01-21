import logo from './logo.svg';
import './App.css';
import React from 'react';
import Cable from 'actioncable';
import Speech from 'speak-tts';
import { WEBSOCKET_HOST } from './baseServerUrl.js';

const speechProperties = {
  'volume': 1,
    'lang': 'en-US',
    'rate': 1,
    'pitch': 1,
    'voice':'Fiona',
    'splitSentences': true,
    'listeners': {
      'onvoiceschanged': (voices) => {
        // console.log("Event voiceschanged", voices)
      }
    }
}

const constraints = { video: {facingMode: 'environment' }, audio: false  }

class App extends React.Component {
  constructor() {
    super()
    this.publisher = React.createRef();
    this.canvas = React.createRef();
    this.subscriber = React.createRef();
    this.speech = this.initializeSpeech();
    this.state = {
      socket: {},
      analyzing: false,
      textContent: '',
    }
  }

  initializeSpeech() {
    const speech = new Speech();
      speech.init(speechProperties)
      .then(data => {
        console.log("Speech is ready", data);
      })
      .catch(e => {
        console.error("An error occured while initializing : ", e);
      });
    return speech;
  }

  componentDidMount() {
    this.createSocket();
    let publisher = this.publisher.current;
    publisher.setAttribute('autoplay', '');
    publisher.setAttribute('muted', '');
    publisher.setAttribute('playsinline', '');

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        publisher.srcObject = stream;
      });
    }

    setInterval(() => {
      if (this.state.analyzing) {
        this.getFrame(publisher)
      }
    }, 1000)
  }

  onClick = () => {
    this.setState({analyzing: !this.state.analyzing})
  }

  getFrame = () => {
    let canvas = document.createElement('canvas')
    canvas.width = 715
    canvas.height = 535
    canvas.getContext('2d').drawImage(this.publisher.current, 0, 0);
    const data = canvas.toDataURL('image/jpeg', 0.5);
    this.state.socket.create(data)
  }

  createSocket() {
    let cable = Cable.createConsumer(WEBSOCKET_HOST)
    let socket = cable.subscriptions.create({
      channel: 'VideoChannel'
    },
    {
      connected: () => {},
      received: (imageData) => this.handleReceivedEvent(imageData),
      create: function(imageData) {
        this.perform('create', { imageData });
      }
    });
    this.setState({ socket: socket })
  };

  handleReceivedEvent = (imageData) => {
    let canvas = this.canvas.current
    let context = canvas.getContext('2d');

    if (imageData.text.trim()) {
      this.speech.speak({
          text: `I see the text: ${imageData.text}`,
      }).then(() => {
          console.log("Success !")
      }).catch(e => {
          console.error("An error occurred :", e)
      })

      this.setState({textContent: this.state.textContent + imageData.text})
    }
    let image = new Image();
    image.onload = () => {
      context.drawImage(image, 0, 0);
    }
    image.src = imageData.image
    context.drawImage(image, 0, 0)
  }

  render() {
    return (
      <div className="App">
        <video id="publisher" ref={this.publisher} width="360" height="320" autoPlay></video>
        <button id="analyze" onClick={this.onClick}>
          {this.state.analyzing ? 'Stop Analysis' : 'Start Analysis'}
        </button>
        <button onClick={() => this.setState({textContent: ''})}>
          Clear Text
        </button>
        <canvas id="canvas" ref={this.canvas} width="355" height="265"></canvas>
        <div>{this.state.textContent}</div>
      </div>
    );
  }
}

export default App;
