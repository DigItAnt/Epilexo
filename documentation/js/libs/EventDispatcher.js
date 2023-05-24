/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

/**
 * @author mrdoob / http://mrdoob.com/
 */

var EventDispatcher=function(){};Object.assign(EventDispatcher.prototype,{addEventListener:function(i,t){void 0===this._listeners&&(this._listeners={});var e=this._listeners;void 0===e[i]&&(e[i]=[]),-1===e[i].indexOf(t)&&e[i].push(t)},hasEventListener:function(i,t){if(void 0===this._listeners)return!1;var e=this._listeners;return void 0!==e[i]&&-1!==e[i].indexOf(t)},removeEventListener:function(i,t){if(void 0!==this._listeners){var e=this._listeners[i];if(void 0!==e){var s=e.indexOf(t);-1!==s&&e.splice(s,1)}}},dispatchEvent:function(i){if(void 0!==this._listeners){var t=this._listeners[i.type];if(void 0!==t){i.target=this;var e=[],s=0,n=t.length;for(s=0;s<n;s++)e[s]=t[s];for(s=0;s<n;s++)e[s].call(this,i)}}}});