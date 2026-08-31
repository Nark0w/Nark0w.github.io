(function installRoomSecurity(globalScope){
  "use strict";

  const ROOM_CODE_LENGTH=10;
  const ROOM_CODE_ALPHABET="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const MAX_MESSAGE_BYTES=64*1024;
  const RATE_WINDOW_MS=2000;
  const RATE_MAX_MESSAGES=40;

  function isPlainRecord(value){
    if(!value||typeof value!=="object"||Array.isArray(value))return false;
    const prototype=Object.getPrototypeOf(value);
    return prototype===Object.prototype||prototype===null
  }

  function boundedString(value,maxLength=240,fallback=""){
    if(typeof value!=="string")return fallback;
    return value.slice(0,Math.max(0,maxLength))
  }

  function boundedInteger(value,min,max,fallback=min){
    const number=Number(value);
    if(!Number.isFinite(number))return fallback;
    return Math.min(max,Math.max(min,Math.trunc(number)))
  }

  function enumValue(value,allowed,fallback=null){return allowed.includes(value)?value:fallback}

  function uniqueStrings(value,allowed,maxItems=allowed.length){
    if(!Array.isArray(value))return [];
    const allowedSet=new Set(allowed),result=[];
    for(const item of value){
      if(typeof item!=="string"||!allowedSet.has(item)||result.includes(item))continue;
      result.push(item);
      if(result.length>=maxItems)break
    }
    return result
  }

  function messageSizeIsSafe(value,maxBytes=MAX_MESSAGE_BYTES){
    try{return new TextEncoder().encode(JSON.stringify(value)).length<=maxBytes}
    catch(error){return false}
  }

  function createRateLimiter(options={}){
    const windowMs=boundedInteger(options.windowMs,250,60000,RATE_WINDOW_MS);
    const maxMessages=boundedInteger(options.maxMessages,1,1000,RATE_MAX_MESSAGES);
    const windows=new Map();
    return {
      accept(key,now=Date.now()){
        const id=String(key||"unknown"),current=windows.get(id);
        if(!current||now-current.startedAt>=windowMs){windows.set(id,{startedAt:now,count:1});return true}
        current.count++;
        return current.count<=maxMessages
      },
      clear(key){windows.delete(String(key||"unknown"))},
      reset(){windows.clear()}
    }
  }

  function normalizeRoomCode(value){
    return String(value||"").toUpperCase().replace(/[^A-Z2-9]/g,"").slice(0,ROOM_CODE_LENGTH)
  }

  function randomRoomCode(cryptoSource=globalScope.crypto){
    if(!cryptoSource||typeof cryptoSource.getRandomValues!=="function")throw new Error("Secure randomness is unavailable");
    const buffer=new Uint32Array(ROOM_CODE_LENGTH);cryptoSource.getRandomValues(buffer);
    return [...buffer].map(value=>ROOM_CODE_ALPHABET[value%ROOM_CODE_ALPHABET.length]).join("")
  }

  const api=Object.freeze({ROOM_CODE_LENGTH,ROOM_CODE_ALPHABET,MAX_MESSAGE_BYTES,RATE_WINDOW_MS,RATE_MAX_MESSAGES,isPlainRecord,boundedString,boundedInteger,enumValue,uniqueStrings,messageSizeIsSafe,createRateLimiter,normalizeRoomCode,randomRoomCode});
  globalScope.RoomSecurity=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api
})(typeof globalThis!=="undefined"?globalThis:window);
