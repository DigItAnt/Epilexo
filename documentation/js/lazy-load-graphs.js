/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

document.addEventListener('DOMContentLoaded', function() {
    var lazyGraphs = [].slice.call(document.querySelectorAll('[lazy]'));
    var active = false;

    var lazyLoad = function() {
        if (active === false) {
            active = true;

            setTimeout(function() {
                lazyGraphs.forEach(function(lazyGraph) {
                    if (
                        lazyGraph.getBoundingClientRect().top <= window.innerHeight &&
                        lazyGraph.getBoundingClientRect().bottom >= 0 &&
                        getComputedStyle(lazyGraph).display !== 'none'
                    ) {
                        lazyGraph.data = lazyGraph.getAttribute('lazy');
                        lazyGraph.removeAttribute('lazy');

                        lazyGraphs = lazyGraphs.filter(function(image) { return image !== lazyGraph});

                        if (lazyGraphs.length === 0) {
                            document.removeEventListener('scroll', lazyLoad);
                            window.removeEventListener('resize', lazyLoad);
                            window.removeEventListener('orientationchange', lazyLoad);
                        }
                    }
                });

                active = false;
            }, 200);
        }
    };

    // initial load
    lazyLoad();

    var container = document.querySelector('.container-fluid.modules');
    if (container) {
        container.addEventListener('scroll', lazyLoad);
        window.addEventListener('resize', lazyLoad);
        window.addEventListener('orientationchange', lazyLoad);
    }

});
