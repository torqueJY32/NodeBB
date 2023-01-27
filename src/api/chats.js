"use strict";
// 'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.kick = exports.invite = exports.users = exports.rename = exports.post = exports.create = void 0;
// const validator = require('validator');
// const user = require('../user');
// const meta = require('../meta');
// const messaging = require('../messaging');
// const plugins = require('../plugins');
// // const websockets = require('../socket.io');
// const socketHelpers = require('../socket.io/helpers');
const validator_1 = __importDefault(require("validator"));
const user_1 = __importDefault(require("../user"));
const meta_1 = __importDefault(require("../meta"));
const messaging_1 = __importDefault(require("../messaging"));
const plugins_1 = __importDefault(require("../plugins"));
const helpers_1 = __importDefault(require("../socket.io/helpers"));
function rateLimitExceeded(caller) {
    const session = caller.request ? caller.request.session : caller.session; // socket vs req
    const now = Date.now();
    session.lastChatMessageTime = session.lastChatMessageTime || 0;
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    if (now - session.lastChatMessageTime < meta_1.default.config.chatMessageDelay) {
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
function create(caller, data) {
    return __awaiter(this, void 0, void 0, function* () {
        if (rateLimitExceeded(caller)) {
            throw new Error('[[error:too-many-messages]]');
        }
        if (!data.uids || !Array.isArray(data.uids)) {
            throw new Error(`[[error:wrong-parameter-type, uids, ${typeof data.uids}, Array]]`);
        }
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        yield Promise.all(data.uids.map((uid) => __awaiter(this, void 0, void 0, function* () { return messaging_1.default.canMessageUser(caller.uid, uid); })));
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const roomId = yield messaging_1.default.newRoom(caller.uid, data.uids);
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call,
        return yield messaging_1.default.getRoomData(roomId);
    });
}
exports.create = create;
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
function post(caller, data) {
    return __awaiter(this, void 0, void 0, function* () {
        if (rateLimitExceeded(caller)) {
            throw new Error('[[error:too-many-messages]]');
        }
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const aggregateHook = yield plugins_1.default.hooks.fire('filter:messaging.send', {
            data,
            uid: caller.uid,
        });
        // console.log("START LOG MSG!!\n");
        // console.log(aggregateHook);
        ({ data } = aggregateHook);
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        yield messaging_1.default.canMessageRoom(caller.uid, data.roomId);
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const message = yield messaging_1.default.sendMessage({
            uid: caller.uid,
            roomId: data.roomId,
            content: data.message,
            timestamp: Date.now(),
            ip: caller.ip,
        });
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        messaging_1.default.notifyUsersInRoom(caller.uid, data.roomId, message);
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        user_1.default.updateOnlineUsers(caller.uid);
        return message;
    });
}
exports.post = post;
function rename(caller, data) {
    return __awaiter(this, void 0, void 0, function* () {
        yield messaging_1.default.renameRoom(caller.uid, data.roomId, data.name);
        const uids = yield messaging_1.default.getUidsInRoom(data.roomId, 0, -1);
        const eventData = { roomId: data.roomId, newName: validator_1.default.escape(String(data.name)) };
        helpers_1.default.emitToUids('event:chats.roomRename', eventData, uids);
        return messaging_1.default.loadRoom(caller.uid, {
            roomId: data.roomId,
        });
    });
}
exports.rename = rename;
;
function users(caller, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const [isOwner, users] = yield Promise.all([
            messaging_1.default.isRoomOwner(caller.uid, data.roomId),
            messaging_1.default.getUsersInRoom(data.roomId, 0, -1),
        ]);
        users.forEach((user) => {
            user.canKick = (parseInt(user.uid, 10) !== parseInt(caller.uid, 10)) && isOwner;
        });
        return { users };
    });
}
exports.users = users;
;
function invite(caller, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const userCount = yield messaging_1.default.getUserCountInRoom(data.roomId);
        const maxUsers = meta_1.default.config.maximumUsersInChatRoom;
        if (maxUsers && userCount >= maxUsers) {
            throw new Error('[[error:cant-add-more-users-to-chat-room]]');
        }
        const uidsExist = yield user_1.default.exists(data.uids);
        if (!uidsExist.every(Boolean)) {
            throw new Error('[[error:no-user]]');
        }
        yield Promise.all(data.uids.map((uid) => __awaiter(this, void 0, void 0, function* () { return messaging_1.default.canMessageUser(caller.uid, uid); })));
        yield messaging_1.default.addUsersToRoom(caller.uid, data.uids, data.roomId);
        delete data.uids;
        return users(caller, data);
    });
}
exports.invite = invite;
;
function kick(caller, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const uidsExist = yield user_1.default.exists(data.uids);
        if (!uidsExist.every(Boolean)) {
            throw new Error('[[error:no-user]]');
        }
        // Additional checks if kicking vs leaving
        if (data.uids.length === 1 && parseInt(data.uids[0], 10) === caller.uid) {
            yield messaging_1.default.leaveRoom([caller.uid], data.roomId);
        }
        else {
            yield messaging_1.default.removeUsersFromRoom(caller.uid, data.uids, data.roomId);
        }
        delete data.uids;
        return users(caller, data);
    });
}
exports.kick = kick;
;
