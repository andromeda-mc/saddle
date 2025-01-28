import { writable } from 'svelte/store';

export const websocket = writable();

export function connectWebSocket(url: string) {
    const socket: WebSocket = new WebSocket(url);

    websocket.set(socket);

    socket.onopen = () => console.log('WebSocket verbunden!');
    socket.onmessage = (message) => console.log('Nachricht empfangen:', message.data);
    socket.onclose = () => console.log('WebSocket geschlossen.');

    return socket;
}

export function disconnectWebSocket() {
    websocket.update((socket: any) => {
        if (socket) socket.close();
    });
}
