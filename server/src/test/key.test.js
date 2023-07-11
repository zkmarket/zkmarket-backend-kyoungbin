import UserKey from "../wallet/keyStruct";

const userKey = UserKey.keyGen();

console.log(userKey.marketKey.pkEnc);