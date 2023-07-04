import UserKey from "./keyStruct";

const delegateServerKey = UserKey.keyGen();

export default {
    delegateServerKey : delegateServerKey,
    pkOwn : delegateServerKey.pk.pkOwn,
    pkEnc : delegateServerKey.pk.pkEnc,
    skOwn : delegateServerKey.skOwn,
    skEnc : delegateServerKey.skEnc,
}