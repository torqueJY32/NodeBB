// 'use strict';

// const validator = require('validator');
import validator from 'validator';

// const user = require('../user');
import user from '../user';

// const meta = require('../meta');
import meta from '../meta';

// const messaging = require('../messaging');
import messaging from '../messaging';

// const plugins = require('../plugins');
import plugins from '../plugins';

// const websockets = require('../socket.io'); THIS WAS COMMENTED
// const socketHelpers = require('../socket.io/helpers');
import socketHelpers from '../socket.io/helpers';

// Import the types to be used


// const chatsAPI = module.exports;
// This is removed for TS


type Session = {
    lastChatMessageTime : number
}

type Data = {
    uids : number[]
    roomId: number
    message: string
    name : string
}

type Request = {
    session : Session
}

type Caller = {
    request : Request,
    session : Session
    uid : number
    ip : string
}

type Message = {
    uid: number
    roomId: number
    content: string
    timestamp: number
    ip: string
}

type EventData = {
    roomId : number,
    newName : string
}

function rateLimitExceeded(caller : Caller) : boolean {
    const session : Session = caller.request ? caller.request.session : caller.session; // socket vs req
    const now : number = Date.now();
    session.lastChatMessageTime = session.lastChatMessageTime || 0;
    if (now - session.lastChatMessageTime < meta.config.chatMessageDelay) {
        return true;
    }
    session.lastChatMessageTime = now;
    return false;
}


export async function create(caller : Caller, data : Data) {
    if (rateLimitExceeded(caller)) {
        throw new Error('[[error:too-many-messages]]');
    }

    // if (!data.uids || !Array.isArray(data.uids)) {
    //     throw new Error(`[[error:wrong-parameter-type, uids, ${typeof data.uids}, Array]]`);
    // }
    // Unused as of type was checked before

    await Promise.all(data.uids.map(async uid => messaging.canMessageUser(caller.uid, uid)));
    const roomId : number = await messaging.newRoom(caller.uid, data.uids);

    return await messaging.getRoomData(roomId);
}




export async function post(caller : Caller, data : Data) {
    if (rateLimitExceeded(caller)) {
        throw new Error('[[error:too-many-messages]]');
    }

    ({ data } = await plugins.hooks.fire('filter:messaging.send', {
        data,
        uid: caller.uid,
    }));

    await messaging.canMessageRoom(caller.uid, data.roomId);
    const message : Message = await messaging.sendMessage({
        uid: caller.uid,
        roomId: data.roomId,
        content: data.message,
        timestamp: Date.now(),
        ip: caller.ip,
    });
    messaging.notifyUsersInRoom(caller.uid, data.roomId, message);
    user.updateOnlineUsers(caller.uid);

    return message;
}

export async function rename(caller : Caller, data : Data) {
    await messaging.renameRoom(caller.uid, data.roomId, data.name);
    const uids : number[] = await messaging.getUidsInRoom(data.roomId, 0, -1) as number[];
    const eventData : EventData = { roomId: data.roomId, newName: validator.escape(String(data.name)) as string} ;

    socketHelpers.emitToUids('event:chats.roomRename', eventData, uids);
    return messaging.loadRoom(caller.uid, {
        roomId: data.roomId,
    });
}

export async function users(caller : Caller, data : Data) {
    const [isOwner, users] = await Promise.all([
        messaging.isRoomOwner(caller.uid, data.roomId),
        messaging.getUsersInRoom(data.roomId, 0, -1),
    ]);
    users.forEach((user) => {
        user.canKick = (parseInt(user.uid, 10) !== caller.uid) && isOwner;
    });
    return { users };
};

export async function invite (caller : Caller, data : Data) {
    const userCount : number = await messaging.getUserCountInRoom(data.roomId);
    const maxUsers : number = meta.config.maximumUsersInChatRoom;
    if (maxUsers && userCount >= maxUsers) {
        throw new Error('[[error:cant-add-more-users-to-chat-room]]');
    }

    const uidsExist : boolean[] = await user.exists(data.uids);
    if (!uidsExist.every(Boolean)) {
        throw new Error('[[error:no-user]]');
    }
    await Promise.all(data.uids.map(async uid => messaging.canMessageUser(caller.uid, uid)));
    await messaging.addUsersToRoom(caller.uid, data.uids, data.roomId);

    delete data.uids;
    return users(caller, data);
};

export async function kick (caller : Caller , data: Data) {
    const uidsExist = await user.exists(data.uids);
    if (!uidsExist.every(Boolean)) {
        throw new Error('[[error:no-user]]');
    }

    // Additional checks if kicking vs leaving
    if (data.uids.length === 1 && data.uids[0] === caller.uid) {
        await messaging.leaveRoom([caller.uid], data.roomId);
    } else {
        await messaging.removeUsersFromRoom(caller.uid, data.uids, data.roomId);
    }

    delete data.uids;
    return users(caller, data);
};
