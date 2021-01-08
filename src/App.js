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
      textContent: '',
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
    }, 1000)
  }

  onClick = () => {
    this.setState({analyzing: !this.state.analyzing})
  }

  getFrame = () => {
    let canvas = this.canvas.current
    canvas.getContext('2d').drawImage(this.publisher.current, 0, 0);
    const data = canvas.toDataURL('image/jpeg', 1);
    this.state.socket.create(data)
  }

  createSocket() {
    let cable = Cable.createConsumer('ws://localhost:3001/cable')
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
    console.log(imageData.text)
    // let canvas = this.canvas.current
    // let image = new Image();
    // let context = canvas.getContext('2d')
    // image.src = imageData;
    // image.onload = function() {
    //   context.drawImage(image, 0, 0);
    // };
    this.setState({textContent: this.state.textContent + imageData.text})
  }

  render() {
    return (
      <div className="App">
        <video id="publisher" ref={this.publisher} width="100%" height="50%" autoPlay></video>
        <button id="analyze" onClick={this.onClick}>
          {this.state.analyzing ? 'Stop Analysis' : 'Start Analysis'}
        </button>
        <button onClick={() => this.setState({textContent: ''})}>
          Clear Text
        </button>
        <canvas hidden={true} id="canvas" ref={this.canvas} width="640" height="480"></canvas>
        <div>{this.state.textContent}</div>
      </div>
    );
  }
}

export default App;
