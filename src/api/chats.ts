// 'use strict';

// const validator = require('validator');

// const user = require('../user');
// const meta = require('../meta');
// const messaging = require('../messaging');
// const plugins = require('../plugins');

// // const websockets = require('../socket.io');
// const socketHelpers = require('../socket.io/helpers');


import validator from 'validator';

import user from '../user';
import meta from '../meta';
import messaging from '../messaging';
import plugins from '../plugins';

import socketHelpers from '../socket.io/helpers';









// const chatsAPI = module.exports;

// function rateLimitExceeded(caller) {
//     const session = caller.request ? caller.request.session : caller.session; // socket vs req
//     const now = Date.now();
//     session.lastChatMessageTime = session.lastChatMessageTime || 0;
//     if (now - session.lastChatMessageTime < meta.config.chatMessageDelay) {
//         return true;
//     }
//     session.lastChatMessageTime = now;
//     return false;
// }




type Session = {
    lastChatMessageTime : number
}

type Data = {
    uids : string[]
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
    uid : string
    ip : string
}



type EventData = {
    roomId : number,
    newName : string
}

type User = {
    uid : string,
    canKick : boolean
}



type Hook = {
    data : Data
    uid : number
}



function rateLimitExceeded(caller : Caller) : boolean {
    const session : Session = caller.request ? caller.request.session : caller.session; // socket vs req
    const now : number = Date.now();
    session.lastChatMessageTime = session.lastChatMessageTime || 0;

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    if (now - session.lastChatMessageTime < meta.config.chatMessageDelay) {
        return true;
    }
    session.lastChatMessageTime = now;
    return false;
}





















// export async function create(caller, data) {
//     if (rateLimitExceeded(caller)) {
//         throw new Error('[[error:too-many-messages]]');
//     }

//     if (!data.uids || !Array.isArray(data.uids)) {
//         throw new Error(`[[error:wrong-parameter-type, uids, ${typeof data.uids}, Array]]`);
//     }

//     await Promise.all(data.uids.map(async uid => messaging.canMessageUser(caller.uid, uid)));
//     const roomId = await messaging.newRoom(caller.uid, data.uids);

//     return await messaging.getRoomData(roomId);
// };
export async function create(caller : Caller, data : Data) {
    if (rateLimitExceeded(caller)) {
        throw new Error('[[error:too-many-messages]]');
    }

    if (!data.uids || !Array.isArray(data.uids)) {
        throw new Error(`[[error:wrong-parameter-type, uids, ${typeof data.uids}, Array]]`);
    }


    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await Promise.all(data.uids.map(async uid => messaging.canMessageUser(caller.uid, uid)));

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const roomId : number = await messaging.newRoom(caller.uid, data.uids) as number;

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call,
    return await messaging.getRoomData(roomId);
}





















// export async function post(caller, data) {
//     if (rateLimitExceeded(caller)) {
//         throw new Error('[[error:too-many-messages]]');
//     }

//     ({ data } = await plugins.hooks.fire('filter:messaging.send', {
//         data,
//         uid: caller.uid,
//     }));

//     await messaging.canMessageRoom(caller.uid, data.roomId);
//     const message = await messaging.sendMessage({
//         uid: caller.uid,
//         roomId: data.roomId,
//         content: data.message,
//         timestamp: Date.now(),
//         ip: caller.ip,
//     });
//     messaging.notifyUsersInRoom(caller.uid, data.roomId, message);
//     user.updateOnlineUsers(caller.uid);

//     return message;
// };

export async function post(caller : Caller, data : Data) {
    if (rateLimitExceeded(caller)) {
        throw new Error('[[error:too-many-messages]]');
    }

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const aggregateHook : Hook = await plugins.hooks.fire('filter:messaging.send', {
        data,
        uid: caller.uid,
    }) as Hook;
    ({ data } = aggregateHook);
    // This part has been modified from the original code so that we can first get the data
    // in its aggregated form, then deconstruct to get the data from the return value
    // This helps ensure the types in between

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await messaging.canMessageRoom(caller.uid, data.roomId);
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const message : string = await messaging.sendMessage({
        uid: caller.uid,
        roomId: data.roomId,
        content: data.message,
        timestamp: Date.now(),
        ip: caller.ip,
    }) as string;
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    messaging.notifyUsersInRoom(caller.uid, data.roomId, message);
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    user.updateOnlineUsers(caller.uid);

    return message;
}






















// export async function rename(caller, data) {
//     await messaging.renameRoom(caller.uid, data.roomId, data.name);
//     const uids = await messaging.getUidsInRoom(data.roomId, 0, -1);
//     const eventData = { roomId: data.roomId, newName: validator.escape(String(data.name)) };

//     socketHelpers.emitToUids('event:chats.roomRename', eventData, uids);
//     return messaging.loadRoom(caller.uid, {
//         roomId: data.roomId,
//     });
// };
export async function rename(caller : Caller, data : Data) {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await messaging.renameRoom(caller.uid, data.roomId, data.name);
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const uids : number[] = await messaging.getUidsInRoom(data.roomId, 0, -1) as number[];
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const eventData : EventData = { roomId: data.roomId, newName: validator.escape(String(data.name)) as string };

    await socketHelpers.emitToUids('event:chats.roomRename', eventData, uids);
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return messaging.loadRoom(caller.uid, {
        roomId: data.roomId,
    });
}

















// export async function users(caller, data) {
//     const [isOwner, users] = await Promise.all([
//         messaging.isRoomOwner(caller.uid, data.roomId),
//         messaging.getUsersInRoom(data.roomId, 0, -1),
//     ]);
//     users.forEach((user) => {
//         user.canKick = (parseInt(user.uid, 10) !== parseInt(caller.uid, 10)) && isOwner;
//     });
//     return { users };
// };



export async function users(caller : Caller, data : Data) {
    const [isOwner, users] : [boolean, User[]] = await Promise.all([
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        messaging.isRoomOwner(caller.uid, data.roomId),
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        messaging.getUsersInRoom(data.roomId, 0, -1),
    ] as [boolean, User[]]);
    users.forEach((user) => {
        user.canKick = (parseInt(user.uid, 10) !== parseInt(caller.uid, 10)) && isOwner;
    });
    return { users };
}










export async function invite(caller, data) {
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
    return users(caller, data);
};

export async function kick(caller, data) {
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
    return users(caller, data);
};
