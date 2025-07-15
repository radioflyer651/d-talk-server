import http from 'http';
import { Socket, Server as SocketIOServer } from 'socket.io';
import { ObjectId } from 'mongodb';
import { TokenPayload } from '../model/shared-models/token-payload.model';
import { verifyToken } from '../auth/jwt';
import { nullToUndefined } from '../utils/empty-and-null.utils';
import { objectIdToStringConverter, stringToObjectIdConverter } from '../utils/object-id-to-string-converter.utils';
import { mergeMap, Observable, Subject, takeUntil } from 'rxjs';
import { LogDbService } from '../database/log-db.service';
import { IAppConfig } from '../model/app-config.model';


/** Represents an event received from socket.io */
export interface SocketServerEvent {
    socket: Socket;
    eventName: string;
    data: any[];
    callback?: (response: any) => void;
    userId?: ObjectId;
}

export type ChatCallback<T> = (args: T) => void;

/** SocketServerEvent with a confirmed userID member. */
export type SocketServerEventWithUserId = Omit<SocketServerEvent, 'userId'> & { userId: ObjectId; } & SocketServer;

/** SocketServerEvent with a confirmed callback member. */
export type SocketServerWithCallback = Omit<SocketServerEvent, 'callback'> & { callback: (response: any) => any; };

/** TypeGuard for a SocketServerEvent to ensure it has a userId. */
export function socketEventHasUserId(socketServerEvent: SocketServerEvent): socketServerEvent is SocketServerEventWithUserId {
    return !!socketServerEvent.userId;
}

/** TypeGuard for a SocketServerEvent to ensure it has a callback. */
export function socketEventHasCallback(socketServerEvent: SocketServerEvent): socketServerEvent is SocketServerEventWithUserId {
    return !!socketServerEvent.callback;
}

export enum SocketErrorTypes {
    Security = 'security',
    BadObjectId = 'bad-object-id',
    InternalError = 'internal-error',
}

/** Performs chat interactions with the UI, using socket.io. This setup
 *   is only intended to support a single back-end server. */
export class SocketServer {
    constructor(
        private readonly loggingService: LogDbService,
    ) {
        this._events$.subscribe(event => {
            this.loggingService.logMessage({
                level: 'info',
                message: `Socket Event: ${event.eventName}`,
                data: {
                    ...event,
                    callback: undefined,
                    socket: undefined,
                }
            });
        });
    }

    /** The socket server.io that is handling socket connections. */
    private socketServer!: SocketIOServer;

    // #region Internals

    registerWithServer(config: IAppConfig, server: http.Server<any, any>) {
        this.socketServer = new SocketIOServer(server, {
            path: '/chat-io/',
            cors: {
                origin: config.corsAllowed ?? [],
                methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE']
            }
        });

        this.initialize();
    }

    protected initialize(): void {
        const onConnectionFunction = async (socket: Socket) => {
            // Determine if they can connect or not.
            if (!(await this.onConnect(socket))) {
                this.loggingService.logMessage({
                    level: 'error',
                    message: `Attempt to connect with bad credentials`
                });

                console.log(`Connection made, but with bad credentials.  Disconnecting.`);
                // Disconnect and exit.
                socket.disconnect();
                return;
            }

            // Get the userId for this socket.  Use this forever and ever.
            const userId = await this.getUserIdForSocket(socket);

            // Attach this to the socket.
            if (!socket.data) {
                socket.data = {};
            }
            socket.data.userId = userId;

            console.log(`Connection established.`);

            // Broadcast the new connection on the observable.
            this._socketConnections$.next(socket);

            // For all events going out, we need to convert ObjectIds to strings.
            socket.onAnyOutgoing((...args) => {
                try {
                    objectIdToStringConverter(args);
                } catch (err) {
                    console.error(`Error Converting args.`, event, err, args);
                }
            });

            // We must convert object IDs of strings to ObjectIds.
            socket.use(([event, ...args], next) => {
                try {
                    stringToObjectIdConverter(args, false);
                } catch (err) {
                    console.error(`Error Converting args.`, event, err, args);
                }

                next();
            });

            // Inform anyone observing connections that we have a new socket connection.
            this._events$.next({
                socket,
                eventName: 'connection',
                userId,
                data: []
            });

            // Register the socket for any events to emit them to observers.
            socket.onAny((event, ...args) => {
                // Create the event.
                try {
                    args = stringToObjectIdConverter(args, false);
                } catch (err) {
                    console.warn('Error converting strings to object IDs.', err);
                }
                const eventObj: SocketServerEvent = {
                    socket,
                    eventName: event,
                    userId,
                    data: args
                };

                // Emit the event.
                this._events$.next(eventObj);
            });

            // Register the disconnection.
            socket.on('disconnect', () => {
                // Inform anyone observing connections that a socket has disconnected.
                this._events$.next({
                    socket,
                    eventName: 'disconnect',
                    userId,
                    data: []
                });
                console.log('Socket disconnected.');
                // this.socketServer.off('connection', onConnectionFunction);
                this.onDisconnect(socket);
            });
        };

        // Register the socket functions with socket.io.
        this.socketServer.on('connection', onConnectionFunction);
    }

    /** Subject that emits when a new socket is connected to the system. */
    private readonly _socketConnections$ = new Subject<Socket>();

    // public socketConnections$ = this._socketConnections$.asObservable();

    private __socketConnections$ = this._socketConnections$.asObservable();
    get socketConnections$(): Observable<Socket> {
        return this.__socketConnections$;
    }

    private _events$ = new Subject<SocketServerEvent>();
    /** Emits when sockets emit events.  NOTE: This does NOT emit callback functions
     *   when sockets have resolver callbacks. */
    get events$(): Observable<SocketServerEvent> {
        return this._events$.asObservable();
    }

    /** Returns the user's ID that owns a specified socket. */
    getUserIdForSocket = async (socket: Socket): Promise<ObjectId | undefined> => {
        // Get the token.
        const token = await this.getTokenPayloadForSocket(socket);

        // Return the right thing.
        return token?.userId;
    };

    /** Returns the TokenPayload for a specified socket, if there is one. */
    private async getTokenPayloadForSocket(socket: Socket): Promise<TokenPayload | undefined> {
        const token = socket.handshake.auth.token as string | undefined;

        // If there's no token, then there's no payload.
        if (!token) {
            return undefined;
        }

        // Get the parsed token.
        const result = nullToUndefined(await verifyToken(token));

        // Ensure the IDs are ObjectIds.
        stringToObjectIdConverter(result, false);

        // Return the result.
        return result;
    }

    /** Called when a socket connects to the server.  This method will
     *   return a boolean value indicating whether or not the socket has the
     *   appropriate credentials. */
    private async onConnect(socket: Socket): Promise<boolean> {
        // Get the TokenPayload for the socket.
        const payload = await this.getTokenPayloadForSocket(socket);

        // Convert the result to a boolean.
        return !!payload;
    }

    private async onDisconnect(socket: Socket): Promise<void> {

    }

    //#endregion

    /** Subscribes to a specified event from NEW sockets connecting to the system. */
    protected subscribeToSocketEvent(socket: Socket, event: string): Observable<SocketServerEvent> {
        // NOTE: Handling of the on('disconnect') event is handled upstream.
        return new Observable(subscriber => {
            const subscriptionFunction = (...args: any[]) => {
                // copy the argument list, so we don't alter it.
                const argsCopy = args.slice();

                // If the last item in the argument list is a callback, then collect
                //  that separately.  Also, remove it from the argument list.
                let resolverCallback: ((value: any) => void) | undefined;
                if (argsCopy.length > 0) {
                    if (typeof argsCopy[argsCopy.length - 1] === 'function') {
                        resolverCallback = argsCopy.pop();
                    }
                }

                // Send the event.
                subscriber.next({
                    socket,
                    data: stringToObjectIdConverter(argsCopy, false),
                    eventName: event,
                    userId: socket.data?.userId,
                    callback: resolverCallback
                });

                // Send the cleanup function.
                return () => {
                    console.log(`Handler disconnected: ${event}`);
                    // Remove the event handlers.
                    socket.off(event, subscriptionFunction);
                };
            };

            // Add the subscription to the socket.
            socket.on(event, subscriptionFunction);
        });
    }

    /** Subscribes to a specified event type. 
     *   IMPORTANT: This does NOT connect to sockets already on the system.  As long as
     *   the consuming service is registering at app startup, this shouldn't be a problem. */
    subscribeToEvent = (eventName: string) => {
        return this.socketConnections$
            .pipe(
                mergeMap(socket => {
                    const disconnectObservableName = 'DISCONNECT_OBSERVABLE';
                    // We're going to do something dirty... we're adding a property to the socket
                    //  so we don't have to have a map to hold it.  Or a weakmap, more importantly.
                    let disconnectObservable = (socket as any)[disconnectObservableName] as Observable<void>;
                    if (!disconnectObservable) {
                        // Add a single onDisconnect handler to this.
                        disconnectObservable = new Observable(subscriber => {
                            socket.on('disconnect', () => {
                                subscriber.next();
                                subscriber.complete();
                            });
                        });

                        // Add the observable.
                        (socket as any)[disconnectObservableName] = disconnectObservable;
                    }

                    // Return the observable with the disconnect attached to it.  Now, if the socket disconnects
                    //  any observers will be made aware, and clean up.
                    return this.subscribeToSocketEvent(socket, eventName).pipe(takeUntil(disconnectObservable));
                })
            );
    };

    /** Sends an error message back to the socket.  This should only be used when an error
     *   occurs for errors resulting from a socket communication issue. */
    reportError(socket: Socket, errorType: SocketErrorTypes, errorMessage: string, trace?: string) {
        trace = trace ?? new Error().stack;
        socket.emit('error', errorType, errorMessage, trace);
    }

    /** Emits a specified event on a specified socket. */
    emitEvent(socket: Socket, eventName: string, ...args: any[]): void {
        socket.emit(eventName, ...args);
    }

    /** Emits an event to all connections. */
    emitEventToAll(eventName: string, ...args: any[]): void {
        this.socketServer.emit(eventName, ...args);
    }

    /** Emits an event to a "room", which is like a group. */
    emitEventToRoom(roomName: string, eventName: string, ...args: any[]): void {
        this.socketServer.in(roomName).emit(eventName, ...args);
    }

    /** Emits an event to a "room", which is like a group. */
    emitEventToRoomExceptTo(roomName: string, eventName: string, excludeSocket: Socket, ...args: any[]): void {
        excludeSocket.broadcast.in(roomName).emit(eventName, ...args);
    }

    /** Instructs a socket to join a specified "room". */
    joinRoom(socket: Socket, roomName: string): void {
        // This is just for abstraction.
        socket.join(roomName);
    }

    /** Instructs a socket to leave a specified "room". */
    leaveRoom(socket: Socket, roomName: string): void {
        // This is just for abstraction.
        socket.leave(roomName);
    }

    /** Sends a specified message to a specified chat room. */
    sendMessageToRoom(roomName: string, eventName: string, ...args: any[]): void {
        this.socketServer.in(roomName).emit(eventName, ...args);
    }
}
