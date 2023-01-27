// 'use strict';

// const validator = require('validator');
import validator from 'validator';

// const user = require('../user');
import user from '../user';

// const meta = require('../meta');
import meta from '../meta';

// const messaging = require('../messaging');
import messaging from '../messaging'

// const plugins = require('../plugins');
import plugins from '../plugins'

// const websockets = require('../socket.io'); THIS WAS COMMENTED
// const socketHelpers = require('../socket.io/helpers');
import socketHelpers from '../socket.io/helpers'

// Import the types to be used
// import { UserObjectFull } from '../types'


// const chatsAPI = module.exports;
// This is removed for TS


type Session = {
    lastChatMessageTime : number
}

type Data = {
    uids : number[]
}

type Request = {
    session : Session
}

type Caller = {
    request : Request,
    session : Session

}

function rateLimitExceeded(caller : Caller) : boolean{
    const session : Session = caller.request ? caller.request.session : caller.session; // socket vs req
    const now : number = Date.now();
    session.lastChatMessageTime = session.lastChatMessageTime || 0;
    if (now - session.lastChatMessageTime < meta.config.chatMessageDelay) {
        return true;
    }
    session.lastChatMessageTime = now;
    return false;
}


export async function create (caller : Caller, data : Data) {
    if (rateLimitExceeded(caller)) {
        throw new Error('[[error:too-many-messages]]');
    }

    // if (!data.uids || !Array.isArray(data.uids)) {
    //     throw new Error(`[[error:wrong-parameter-type, uids, ${typeof data.uids}, Array]]`);
    // }
    // Unused as of type was checked before

    await Promise.all(data.uids.map(async uid => messaging.canMessageUser(caller.uid, uid)));
    const roomId = await messaging.newRoom(caller.uid, data.uids);

    return await messaging.getRoomData(roomId);
};




export async function post (caller, data) => {
    if (rateLimitExceeded(caller)) {
        throw new Error('[[error:too-many-messages]]');
    }

    ({ data } = await plugins.hooks.fire('filter:messaging.send', {
        data,
        uid: caller.uid,
    }));

    await messaging.canMessageRoom(caller.uid, data.roomId);
    const message = await messaging.sendMessage({
        uid: caller.uid,
        roomId: data.roomId,
        content: data.message,
        timestamp: Date.now(),
        ip: caller.ip,
    });
    messaging.notifyUsersInRoom(caller.uid, data.roomId, message);
    user.updateOnlineUsers(caller.uid);

    return message;
};

export async function rename (caller, data) => {
    await messaging.renameRoom(caller.uid, data.roomId, data.name);
    const uids = await messaging.getUidsInRoom(data.roomId, 0, -1);
    const eventData = { roomId: data.roomId, newName: validator.escape(String(data.name)) };

    socketHelpers.emitToUids('event:chats.roomRename', eventData, uids);
    return messaging.loadRoom(caller.uid, {
        roomId: data.roomId,
    });
};

export async function users (caller, data) => {
    const [isOwner, users] = await Promise.all([
        messaging.isRoomOwner(caller.uid, data.roomId),
        messaging.getUsersInRoom(data.roomId, 0, -1),
    ]);
    users.forEach((user) => {
        user.canKick = (parseInt(user.uid, 10) !== parseInt(caller.uid, 10)) && isOwner;
    });
    return { users };
};

export async function invite (caller, data) => {
    const userCount = await messaging.getUserCountInRoom(data.roomId);
    const maxUsers = meta.config.maximumUsersInChatRoom;
    if (maxUsers && userCount >= maxUsers) {
        throw new Error('[[error:cant-add-more-users-to-chat-room]]');
    }

    const uidsExist = await user.exists(data.uids);
    if (!uidsExist.every(Boolean)) {
        throw new Error('[[error:no-user]]');
    }
    await Promise.all(data.uids.map(async uid => messaging.canMessageUser(caller.uid, uid)));
    await messaging.addUsersToRoom(caller.uid, data.uids, data.roomId);

    delete data.uids;
    return chatsAPI.users(caller, data);
};

export async function kick (caller, data) => {
    const uidsExist = await user.exists(data.uids);
    if (!uidsExist.every(Boolean)) {
        throw new Error('[[error:no-user]]');
    }

    // Additional checks if kicking vs leaving
    if (data.uids.length === 1 && parseInt(data.uids[0], 10) === caller.uid) {
        await messaging.leaveRoom([caller.uid], data.roomId);
    } else {
        await messaging.removeUsersFromRoom(caller.uid, data.uids, data.roomId);
    }

    delete data.uids;
    return chatsAPI.users(caller, data);
};
