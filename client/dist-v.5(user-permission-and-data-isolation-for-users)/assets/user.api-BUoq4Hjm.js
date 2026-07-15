import{c as r,e as t}from"./index-DI0GZEhk.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const n=[["polygon",{points:"22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3",key:"1yg77f"}]],p=r("Filter",n),u=async s=>{const e=await t.get("/users",{params:s});return{users:e.data.data.users,meta:e.data.meta}},i=async s=>(await t.get(`/users/${s}`)).data.data.user,d=async s=>(await t.post("/users",s)).data,y=async({id:s,values:e})=>(await t.put(`/users/${s}`,e)).data,w=async({id:s,isActive:e})=>{const a=e?"activate":"deactivate";return(await t.patch(`/users/${s}/${a}`)).data},l=async s=>(await t.post(`/users/${s}/reset-password`)).data,U=async s=>(await t.delete(`/users/${s}`)).data;export{p as F,d as c,U as d,i as g,u as l,l as r,w as s,y as u};
