const PREFIX='my-learning-hub-local-v1';
export const localKey=(kind:string)=>PREFIX+':'+kind;
export function readCollection<T=any>(kind:string):T[]{try{return JSON.parse(localStorage.getItem(localKey(kind))||'[]') as T[]}catch{return[];}}
export function writeCollection<T=any>(kind:string,items:T[]){localStorage.setItem(localKey(kind),JSON.stringify(items));}
export function makeId(){return globalThis.crypto?.randomUUID?.()||'id-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);}
export async function fileToDataUrl(file:File):Promise<string>{return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(r.error);r.readAsDataURL(file);});}
