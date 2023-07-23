import UserKey from "./keyStruct";

const delegateServerKey = UserKey.keyGen();
const auditorKey = UserKey.keyGen();


export default {
    auditorKey : auditorKey,
    delegateServerKey : delegateServerKey,
    pkOwn : delegateServerKey.pk.pkOwn,
    pkEnc : delegateServerKey.pk.pkEnc,
    skOwn : delegateServerKey.skOwn,
    skEnc : delegateServerKey.skEnc,
}