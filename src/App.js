import logo from './logo.svg';
import './App.css';
import React from 'react';
import Cable from 'actioncable';

class App extends React.Component {
  constructor() {
    super()
    this.publisher = React.createRef();
    this.canvas = React.createRef();
    this.subscriber = React.createRef()
    this.state = {
      socket: {},
      analyzing: false,
    }
  }

  componentDidMount() {
    this.createSocket();
    let publisher = this.publisher.current;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        publisher.srcObject = stream;
        publisher.play();
      });
    }


    setInterval(() => {
      if (this.state.analyzing) {
        this.getFrame(publisher)
      }
    }, 1000 / 10)
  }

  onClick = () => {
    this.setState({analyzing: !this.state.analyzing})
  }


  getFrame = (video) => {
    // const canvas = document.createElement('canvas');
    // canvas.width = video.videoWidth;
    // canvas.height = video.videoHeight;
    let canvas = this.canvas.current
    canvas.getContext('2d').drawImage(video, 0, 0);
    const data = canvas.toDataURL('image/jpeg', 0.25);
    this.state.socket.create({ imageData: data })
  }

  createSocket() {
    let cable = Cable.createConsumer('ws://localhost:3001/cable')
    let socket = cable.subscriptions.create({
      channel: 'VideoChannel'
    },
    {
      connected: () => {},
      received: (response) => this.handleReceivedEvent(response.imageData),
      create: function(imageData) {
        this.perform('create', { imageData });
      }
    });
    this.setState({ socket: socket })
  };

  handleReceivedEvent = (imageData) => {
    console.log(imageData)
    let canvas = this.canvas.current
    let image = new Image();
    let context = canvas.getContext('2d')
    image.src = imageData;
    image.onload = function() {
      context.drawImage(image, 0, 0);
    };
  }

  render() {
    return (
      <div className="App">
        <video id="publisher" ref={this.publisher} width="200" height="200" autoPlay></video>
        <button id="analyze" onClick={this.onClick}>
          {this.state.analyzing ? 'Stop Analysis' : 'Begin Analysis'}
        </button>
        <canvas hidden={!this.state.analyzing} id="canvas" ref={this.canvas} width="640" height="480"></canvas>
      </div>
    );
  }
}

export default App;
