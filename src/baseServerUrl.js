export const WEBSOCKET_HOST = process.env.NODE_ENV === 'development' ? 'ws://localhost:3001/cable' : 'wss://relay_server.herokuapp.com/cable';
