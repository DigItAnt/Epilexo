/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

document.addEventListener('DOMContentLoaded', function() {
    var tabs = document.getElementsByClassName('nav-tabs'),
        updateAddress = function(e) {
            if(history.pushState && e.target.dataset.link) {
                history.pushState(null, null, '#' + e.target.dataset.link);
            }
        };
    if (tabs.length > 0) {
        tabs = tabs[0].querySelectorAll('li');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].addEventListener('click', updateAddress);
            var linkTag = tabs[i].querySelector('a');
            if (location.hash !== '') {
                var currentHash = location.hash.substr(1);
                if (currentHash === linkTag.dataset.link) {
                    linkTag.click();
                }
            }
        }
    }
});
